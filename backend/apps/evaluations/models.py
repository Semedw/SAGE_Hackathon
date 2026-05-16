from django.db import models


class RiskLevel(models.TextChoices):
    LOW = "LOW", "Low Risk"
    MEDIUM = "MEDIUM", "Medium Risk"
    HIGH = "HIGH", "High Risk"


class Evaluation(models.Model):
    application = models.OneToOneField(
        "applications.Application",
        on_delete=models.CASCADE,
        related_name="evaluation",
    )
    completeness_score = models.FloatField()
    consistency_score = models.FloatField()
    quality_score = models.FloatField()
    identity_score = models.FloatField()
    risk_score = models.FloatField()
    total_score = models.FloatField()
    confidence_score = models.FloatField()
    risk_level = models.CharField(
        max_length=10, choices=RiskLevel.choices, default=RiskLevel.MEDIUM
    )
    summary = models.TextField(blank=True)
    issues = models.JSONField(default=list, blank=True)
    suggestions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Evaluation #{self.id} - App {self.application_id} - Score: {self.total_score}"
