from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from apps.applications.models import Application, Status
from apps.applications.serializers import ApplicationDetailSerializer
from apps.notifications.models import Notification
from .models import ReviewerAction, ActionType, AuditLog
from .serializers import (
    ReviewerApplicationListSerializer,
    ReviewerApplicationDetailSerializer,
    ReviewerActionSerializer,
)
from services.audit_service import AuditService


class ReviewerIsAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("REVIEWER", "ADMIN")


class ReviewerApplicationListView(generics.ListAPIView):
    serializer_class = ReviewerApplicationListSerializer
    permission_classes = [ReviewerIsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "updated_at"]
    search_fields = ["user__email", "user__name", "id"]

    def get_queryset(self):
        queryset = Application.objects.exclude(status=Status.DRAFT)

        risk = self.request.query_params.get("risk")
        if risk:
            from apps.evaluations.models import Evaluation
            queryset = queryset.filter(evaluation__risk_level=risk.upper())

        missing_docs = self.request.query_params.get("missing_docs")
        if missing_docs == "true":
            from django.db.models import Count
            from apps.documents.models import Document
            queryset = queryset.annotate(
                doc_count=Count("documents")
            ).filter(doc_count__lt=3)

        ordering = self.request.query_params.get("ordering", "-created_at")
        if "score" in ordering:
            from apps.evaluations.models import Evaluation
            prefix = "-" if ordering.startswith("-") else ""
            queryset = queryset.filter(evaluation__isnull=False).order_by(
                f"{prefix}evaluation__total_score"
            )
        else:
            queryset = queryset.order_by(ordering)

        return queryset


class ReviewerApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = ReviewerApplicationDetailSerializer
    permission_classes = [ReviewerIsAuthenticated]

    def get_queryset(self):
        return Application.objects.all()


class ReviewerActionView(APIView):
    permission_classes = [ReviewerIsAuthenticated]

    def post(self, request, pk):
        application = get_object_or_404(Application, pk=pk)
        action = request.data.get("action")
        comment = request.data.get("comment", "")

        if action not in ActionType.values:
            return Response(
                {"error": f"Invalid action. Must be one of: {', '.join(ActionType.values)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action_obj = ReviewerAction.objects.create(
            application=application,
            reviewer=request.user,
            action=action,
            comment=comment,
        )

        status_map = {
            ActionType.APPROVED: Status.APPROVED,
            ActionType.REJECTED: Status.REJECTED,
            ActionType.CORRECTION_REQUESTED: Status.CORRECTION_NEEDED,
            ActionType.ESCALATED: Status.UNDER_REVIEW,
        }

        new_status = status_map.get(action, application.status)
        application.status = new_status
        application.save(update_fields=["status"])

        AuditService.log_reviewer_action(
            application, action, request.user.id, comment
        )

        action_display = dict(ActionType.choices).get(action, action)
        Notification.objects.create(
            application=application,
            user=application.user,
            type="STATUS_UPDATE",
            message=f"Your application has been {action_display.lower()}.",
        )

        return Response(
            ReviewerActionSerializer(action_obj).data,
            status=status.HTTP_201_CREATED,
        )
