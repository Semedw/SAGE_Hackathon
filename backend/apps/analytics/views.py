from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Avg, Q
from apps.applications.models import Application, Status
from apps.evaluations.models import Evaluation, RiskLevel
from apps.reviewer.models import ReviewerAction


class AdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("REVIEWER", "ADMIN")


class DashboardAnalyticsView(APIView):
    permission_classes = [AdminOnly]

    def get(self, request):
        total = Application.objects.exclude(status=Status.DRAFT).count()
        evaluated = Evaluation.objects.count()

        avg_score = Evaluation.objects.aggregate(avg=Avg("total_score"))["avg"] or 0

        high_risk = Application.objects.filter(
            evaluation__risk_level=RiskLevel.HIGH
        ).count()

        pending_review = Application.objects.filter(
            status=Status.UNDER_REVIEW
        ).count()

        approved = Application.objects.filter(status=Status.APPROVED).count()
        rejected = Application.objects.filter(status=Status.REJECTED).count()

        status_counts = (
            Application.objects.exclude(status=Status.DRAFT)
            .values("status")
            .annotate(count=Count("id"))
        )

        risk_distribution = (
            Evaluation.objects.values("risk_level")
            .annotate(count=Count("id"))
        )

        return Response({
            "total_applications": total,
            "evaluated": evaluated,
            "average_score": round(avg_score, 2) if avg_score else 0,
            "high_risk_count": high_risk,
            "pending_review": pending_review,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": round(approved / total * 100, 1) if total else 0,
            "status_distribution": list(status_counts),
            "risk_distribution": list(risk_distribution),
        })
