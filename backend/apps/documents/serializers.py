from rest_framework import serializers
from .models import Document, DocumentType


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id", "application", "type", "file", "file_name",
            "file_size", "mime_type", "ocr_text", "ocr_confidence",
            "quality_score", "is_blurry", "uploaded_at",
        ]
        read_only_fields = [
            "id", "application", "file_name", "file_size",
            "mime_type", "ocr_text", "ocr_confidence",
            "quality_score", "is_blurry", "uploaded_at",
        ]


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "type", "file", "file_name", "file_size", "mime_type"]
        read_only_fields = ["id"]

    def validate_file(self, value):
        allowed_mimes = [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
        ]
        mime_type = getattr(value.file, "content_type", None)
        ext = value.name.split(".")[-1].lower()
        allowed_exts = ["pdf", "png", "jpg", "jpeg"]

        if ext not in allowed_exts:
            raise serializers.ValidationError(
                f"Invalid file extension: .{ext}. Allowed: {', '.join(allowed_exts)}"
            )

        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File too large ({value.size / 1024 / 1024:.1f} MB). Max: 10MB"
            )

        return value
