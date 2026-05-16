from rest_framework import generics, permissions
from .models import Application, Status
from .serializers import ApplicationListSerializer, ApplicationDetailSerializer
from apps.documents.models import Document


class ApplicantApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationListSerializer

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ApplicantApplicationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ApplicationDetailSerializer

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.status == Status.CORRECTION_NEEDED:
            serializer.save(status=Status.SUBMITTED)
        else:
            serializer.save()
