from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    APPLICANT = "APPLICANT", "Applicant"
    REVIEWER = "REVIEWER", "Reviewer"
    ADMIN = "ADMIN", "Admin"


class User(AbstractUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.APPLICANT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "name"]

    def __str__(self):
        return f"{self.email} ({self.role})"
