from rest_framework import serializers
from apps.applications.models import Application
from apps.evaluations.models import Evaluation
from apps.documents.models import Document
from apps.users.serializers import UserSerializer
from .models import ReviewerAction, AuditLog


class ReviewerApplicationListSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    document_count = serializers.SerializerMethodField()
    evaluation = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id", "user", "status", "document_count",
            "evaluation", "created_at", "updated_at",
        ]

    def get_document_count(self, obj):
        return Document.objects.filter(application=obj).count()

    def get_evaluation(self, obj):
        try:
            ev = Evaluation.objects.get(application=obj)
            return {
                "total_score": ev.total_score,
                "risk_level": ev.risk_level,
                "confidence_score": ev.confidence_score,
            }
        except Evaluation.DoesNotExist:
            return None


class ReviewerApplicationDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    documents = serializers.SerializerMethodField()
    evaluation = serializers.SerializerMethodField()
    reviewer_actions = serializers.SerializerMethodField()
    audit_logs = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id", "user", "status", "notes",
            "documents", "evaluation", "reviewer_actions",
            "audit_logs", "created_at", "updated_at",
        ]

    def get_documents(self, obj):
        from apps.documents.serializers import DocumentSerializer
        docs = Document.objects.filter(application=obj)
        return DocumentSerializer(docs, many=True).data

    def get_evaluation(self, obj):
        try:
            from apps.evaluations.serializers import EvaluationSerializer
            ev = Evaluation.objects.get(application=obj)
            return EvaluationSerializer(ev).data
        except Evaluation.DoesNotExist:
            return None

    def get_reviewer_actions(self, obj):
        actions = ReviewerAction.objects.filter(application=obj)
        return ReviewerActionSerializer(actions, many=True).data

    def get_audit_logs(self, obj):
        from .models import AuditLog
        logs = AuditLog.objects.filter(application=obj)
        return AuditLogSerializer(logs, many=True).data


class ReviewerActionSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = ReviewerAction
        fields = [
            "id", "application", "reviewer", "reviewer_name",
            "action", "comment", "created_at",
        ]
        read_only_fields = ["id", "reviewer", "reviewer_name", "created_at"]

    def get_reviewer_name(self, obj):
        return obj.reviewer.name


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ["id", "application", "action", "details", "created_at"]
        read_only_fields = ["id", "created_at"]
