from rest_framework import serializers
from .models import Evaluation


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = "__all__"
        read_only_fields = [
            "id", "application", "completeness_score",
            "consistency_score", "quality_score", "identity_score",
            "risk_score", "total_score", "confidence_score",
            "risk_level", "summary", "issues", "suggestions", "created_at",
        ]
