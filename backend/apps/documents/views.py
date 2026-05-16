import os
from rest_framework import generics, parsers, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from apps.applications.models import Application
from .models import Document, DocumentType
from .serializers import DocumentSerializer, DocumentUploadSerializer


class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        application = get_object_or_404(
            Application, pk=self.kwargs["pk"], user=self.request.user
        )
        return Document.objects.filter(application=application)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DocumentUploadSerializer
        return DocumentSerializer

    def create(self, request, *args, **kwargs):
        application = get_object_or_404(
            Application, pk=self.kwargs["pk"], user=self.request.user
        )
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save(application=application)

        from services.ocr_service import perform_ocr
        ocr_result = perform_ocr(document.file.path)
        document.ocr_text = ocr_result.get("text")
        document.ocr_confidence = ocr_result.get("confidence")

        if document.mime_type and document.mime_type.startswith("image/"):
            from services.image_quality_service import analyze_image_quality
            quality = analyze_image_quality(document.file.path)
            document.quality_score = quality.get("score")
            document.is_blurry = quality.get("is_blurry", False)

        document.save()

        Application.objects.filter(pk=application.pk).update(status="SUBMITTED")

        return Response(
            DocumentSerializer(document).data,
            status=status.HTTP_201_CREATED,
        )


class DocumentDeleteView(generics.DestroyAPIView):
    def get_queryset(self):
        application = get_object_or_404(
            Application, pk=self.kwargs["pk"], user=self.request.user
        )
        return Document.objects.filter(application=application)

    def get_object(self):
        queryset = self.get_queryset()
        return get_object_or_404(queryset, pk=self.kwargs["doc_pk"])
