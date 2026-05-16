from django.db import models


class DocumentType(models.TextChoices):
    ID_CARD = "ID_CARD", "ID Card"
    INCOME_PROOF = "INCOME_PROOF", "Income Proof"
    ADDRESS_PROOF = "ADDRESS_PROOF", "Address Proof"
    MEDICAL_RECORD = "MEDICAL_RECORD", "Medical Record"
    INSURANCE_FORM = "INSURANCE_FORM", "Insurance Form"
    SUPPORTING = "SUPPORTING", "Supporting Document"


class Document(models.Model):
    application = models.ForeignKey(
        "applications.Application",
        on_delete=models.CASCADE,
        related_name="documents",
    )
    type = models.CharField(
        max_length=30, choices=DocumentType.choices, default=DocumentType.SUPPORTING
    )
    file = models.FileField(upload_to="documents/%Y/%m/%d/")
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()
    mime_type = models.CharField(max_length=100)
    ocr_text = models.TextField(blank=True, null=True)
    ocr_confidence = models.FloatField(blank=True, null=True)
    quality_score = models.FloatField(blank=True, null=True)
    is_blurry = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.get_type_display()} - {self.file_name}"
