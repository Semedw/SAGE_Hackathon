from django.db import models
from django.conf import settings


class NotificationType(models.TextChoices):
    INFO = "INFO", "Information"
    WARNING = "WARNING", "Warning"
    CORRECTION_NEEDED = "CORRECTION_NEEDED", "Correction Needed"
    STATUS_UPDATE = "STATUS_UPDATE", "Status Update"


class Notification(models.Model):
    application = models.ForeignKey(
        "applications.Application",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(
        max_length=30, choices=NotificationType.choices, default=NotificationType.INFO
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type}] {self.message[:50]}"
