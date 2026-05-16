from rest_framework import serializers
from .models import Application


class ApplicationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            "id", "status", "notes", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ApplicationDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            "id", "user", "status", "notes", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]
