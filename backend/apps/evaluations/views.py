from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.applications.models import Application, Status
from .models import Evaluation
from .serializers import EvaluationSerializer
from .engine import engine as scoring_engine
from services.audit_service import AuditService
from apps.notifications.models import Notification
from apps.documents.models import Document


class EvaluateApplicationView(APIView):
    def post(self, request, pk):
        application = get_object_or_404(
            Application, pk=pk, user=request.user
        )
        documents = Document.objects.filter(application=application)

        if not documents.exists():
            return Response(
                {"error": "No documents uploaded. Please upload documents first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = scoring_engine.evaluate(application, documents)

        evaluation, created = Evaluation.objects.update_or_create(
            application=application,
            defaults={
                "completeness_score": result["criteria"]["Document Completeness"]["score"],
                "consistency_score": result["criteria"]["Data Consistency"]["score"],
                "quality_score": result["criteria"]["Document Quality"]["score"],
                "identity_score": result["criteria"]["Identity Verification"]["score"],
                "risk_score": result["criteria"]["Risk Assessment"]["score"],
                "total_score": result["total_score"],
                "confidence_score": result["confidence"],
                "risk_level": result["risk_level"],
                "summary": result["summary"],
                "issues": result["issues"],
                "suggestions": result["suggested_review_areas"],
            },
        )

        application.status = Status.UNDER_REVIEW
        application.save(update_fields=["status"])

        AuditService.log_evaluation(application, evaluation)

        has_critical_issues = evaluation.total_score < 50
        if has_critical_issues:
            Notification.objects.create(
                application=application,
                user=application.user,
                type="CORRECTION_NEEDED",
                message=(
                    "Your application has some issues that need attention. "
                    "Please check your application status for details."
                ),
            )

        return Response(EvaluationSerializer(evaluation).data, status=status.HTTP_201_CREATED)


class EvaluationDetailView(APIView):
    def get(self, request, pk):
        application = get_object_or_404(
            Application, pk=pk, user=request.user
        )
        evaluation = get_object_or_404(Evaluation, application=application)
        return Response(EvaluationSerializer(evaluation).data)
