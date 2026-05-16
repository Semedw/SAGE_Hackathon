import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import Role
from apps.applications.models import Application, Status
from apps.documents.models import Document, DocumentType
from apps.evaluations.models import Evaluation, RiskLevel
from apps.evaluations.engine import engine as scoring_engine
from apps.notifications.models import Notification
from apps.reviewer.models import ReviewerAction, ActionType, AuditLog
from services.audit_service import AuditService

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo data for InsureCheck AI"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        # Clean up old demo applications to avoid stale data
        try:
            applicant_user = User.objects.get(email="john@example.com")
            from apps.documents.models import Document
            from apps.evaluations.models import Evaluation
            from apps.notifications.models import Notification
            from apps.reviewer.models import ReviewerAction, AuditLog
            for app in Application.objects.filter(user=applicant_user):
                Document.objects.filter(application=app).delete()
                Evaluation.objects.filter(application=app).delete()
                Notification.objects.filter(application=app).delete()
                ReviewerAction.objects.filter(application=app).delete()
                AuditLog.objects.filter(application=app).delete()
                app.delete()
        except User.DoesNotExist:
            pass

        applicant = self._get_or_create_user(
            email="john@example.com",
            name="John Smith",
            username="johnsmith",
            role=Role.APPLICANT,
        )
        self._get_or_create_user(
            email="reviewer@example.com",
            name="Sarah Reviewer",
            username="sarahreviewer",
            role=Role.REVIEWER,
        )
        self._get_or_create_user(
            email="admin@example.com",
            name="Admin User",
            username="adminuser",
            role=Role.ADMIN,
        )

        self._create_good_application(applicant)
        self._create_incomplete_application(applicant)
        self._create_fraud_risk_application(applicant)
        self._create_blurry_application(applicant)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
        self.stdout.write("  Users: john@example.com / reviewer@example.com / admin@example.com")
        self.stdout.write("  Password for all: password123")

    def _get_or_create_user(self, email, name, username, role):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "name": name,
                "username": username,
                "role": role,
            },
        )
        if created:
            user.set_password("password123")
            user.save()
        return user

    def _create_good_application(self, user):
        app = Application.objects.create(user=user, status=Status.SUBMITTED)
        docs = [
            (DocumentType.ID_CARD, "id_card.pdf", 450000, 0.92),
            (DocumentType.INCOME_PROOF, "income_proof.pdf", 320000, 0.88),
            (DocumentType.INSURANCE_FORM, "insurance_form.pdf", 280000, 0.95),
            (DocumentType.ADDRESS_PROOF, "address_proof.pdf", 150000, 0.90),
        ]
        for doc_type, fname, fsize, conf in docs:
            Document.objects.create(
                application=app,
                type=doc_type,
                file=f"demo/{fname}",
                file_name=fname,
                file_size=fsize,
                mime_type="application/pdf",
                ocr_text=self._get_demo_ocr_text_good(doc_type),
                ocr_confidence=conf,
                quality_score=0.95,
                is_blurry=False,
            )

        self._run_evaluation(app)
        app.status = Status.APPROVED
        app.save()

    def _create_incomplete_application(self, user):
        app = Application.objects.create(user=user, status=Status.SUBMITTED)
        docs = [
            (DocumentType.ID_CARD, "id_card_blurry.jpg", 250000, 0.45),
            (DocumentType.INSURANCE_FORM, "insurance_form_maria.pdf", 200000, 0.85),
        ]
        for doc_type, fname, fsize, conf in docs:
            Document.objects.create(
                application=app,
                type=doc_type,
                file=f"demo/{fname}",
                file_name=fname,
                file_size=fsize,
                mime_type="image/jpeg" if fname.endswith(".jpg") else "application/pdf",
                ocr_text=self._get_demo_ocr_text_incomplete(doc_type),
                ocr_confidence=conf,
                quality_score=0.3 if fname.endswith(".jpg") else 0.8,
                is_blurry=fname.endswith(".jpg"),
            )

        self._run_evaluation(app)
        app.status = Status.CORRECTION_NEEDED
        app.save()

        Notification.objects.get_or_create(
            application=app,
            user=user,
            type="CORRECTION_NEEDED",
            defaults={
                "message": "Your application is missing a valid income proof document. "
                           "Correcting this issue may significantly speed up processing.",
            },
        )

    def _create_fraud_risk_application(self, user):
        app = Application.objects.create(user=user, status=Status.SUBMITTED)
        docs = [
            (
                DocumentType.ID_CARD,
                "id_card_fraud.pdf",
                350000,
                0.82,
                "Name: Robert Chen\nID: 123-45-6789\nDOB: 01/15/1990\nAddress: 123 Main St, NY",
            ),
            (
                DocumentType.INCOME_PROOF,
                "income_proof_fraud.pdf",
                300000,
                0.78,
                "Name: Robert Chen\nIncome: $95,000\nEmployer: Tech Corp\nAddress: 456 Oak Ave, LA",
            ),
            (
                DocumentType.INSURANCE_FORM,
                "insurance_form_fraud.pdf",
                250000,
                0.88,
                "Full Name: Robert Chen\nPolicy: P-98765\nDOB: 01/15/1990\nAddress: 123 Main St, NY",
            ),
        ]
        for doc_type, fname, fsize, conf, text in docs:
            Document.objects.create(
                application=app,
                type=doc_type,
                file=f"demo/{fname}",
                file_name=fname,
                file_size=fsize,
                mime_type="application/pdf",
                ocr_text=text,
                ocr_confidence=conf,
                quality_score=0.7,
                is_blurry=False,
            )

        self._run_evaluation(app)
        app.status = Status.UNDER_REVIEW
        app.save()

    def _create_blurry_application(self, user):
        app = Application.objects.create(user=user, status=Status.SUBMITTED)
        docs = [
            (
                DocumentType.ID_CARD,
                "blurry_id.jpg",
                80000,
                0.32,
                "Name: Lisa Wong\nID: 987-65-4321\nDOB: 05/20/1985",
            ),
            (
                DocumentType.INCOME_PROOF,
                "income_proof_dark.jpg",
                120000,
                0.28,
                "Name: Lisa Wong\nIncome: $72,000\nEmployer: Health Inc",
            ),
            (
                DocumentType.INSURANCE_FORM,
                "insurance_form_lisa.pdf",
                180000,
                0.72,
                "Name: Lisa Wong\nPolicy: P-54321\nDOB: 05/20/1985",
            ),
        ]
        for doc_type, fname, fsize, conf, text in docs:
            is_img = fname.endswith(".jpg")
            Document.objects.create(
                application=app,
                type=doc_type,
                file=f"demo/{fname}",
                file_name=fname,
                file_size=fsize,
                mime_type="image/jpeg" if is_img else "application/pdf",
                ocr_text=text,
                ocr_confidence=conf,
            quality_score=0.15 if is_img else 0.85,
            is_blurry=is_img,
        )

        self._run_evaluation(app)
        app.status = Status.UNDER_REVIEW
        app.save()

    def _run_evaluation(self, app):
        documents = Document.objects.filter(application=app)
        result = scoring_engine.evaluate(app, documents)
        Evaluation.objects.update_or_create(
            application=app,
            defaults={
                "completeness_score": result["criteria"]["Document Completeness"]["score"],
                "consistency_score": result["criteria"]["Data Consistency"]["score"],
                "quality_score": result["criteria"]["Document Quality"]["score"],
                "identity_score": result["criteria"]["Identity Verification"]["score"],
                "risk_score": result["criteria"]["Risk Assessment"]["score"],
                "total_score": result["total_score"],
                "confidence_score": result["confidence"],
                "risk_level": result["risk_level"],
                "summary": result["summary"],
                "issues": result["issues"],
                "suggestions": result["suggested_review_areas"],
            },
        )

    def _get_demo_ocr_text_good(self, doc_type):
        texts = {
            DocumentType.ID_CARD: (
                "Name: John Smith\n"
                "ID: 123-45-6789\n"
                "DOB: 01/15/1988\n"
                "Address: 123 Main Street, New York, NY 10001\n"
                "Issued: 01/15/2018\n"
                "Expiry: 01/15/2028\n"
            ),
            DocumentType.INCOME_PROOF: (
                "Name: John Smith\n"
                "Employer: ABC Corp\n"
                "Annual Income: $85,000\n"
                "Address: 123 Main Street, New York, NY 10001\n"
                "Date: 01/15/2024\n"
            ),
            DocumentType.INSURANCE_FORM: (
                "Full Name: John Smith\n"
                "Policy Number: P-123456\n"
                "Date of Birth: 01/15/1988\n"
                "Address: 123 Main Street, New York, NY 10001\n"
                "Applicant Signature: John Smith\n"
                "Date: 02/01/2024\n"
            ),
            DocumentType.ADDRESS_PROOF: (
                "Name: John Smith\n"
                "Address: 123 Main Street, New York, NY 10001\n"
                "Utility: Electric Bill\n"
                "Date: 01/01/2024\n"
            ),
        }
        return texts.get(doc_type, "No text extracted")

    def _get_demo_ocr_text_incomplete(self, doc_type):
        texts = {
            DocumentType.ID_CARD: (
                "Name: Maria Garcia\n"
                "ID: 456-78-9012\n"
                "DOB: 03/22/1992\n"
                "Address: 456 Oak Avenue, Los Angeles, CA 90001\n"
            ),
            DocumentType.INSURANCE_FORM: (
                "Full Name: Maria Garcia\n"
                "Policy Number: P-789012\n"
                "Date of Birth: 03/22/1992\n"
                "Address: 456 Oak Avenue, Los Angeles, CA 90001\n"
            ),
        }
        return texts.get(doc_type, "No text extracted")
