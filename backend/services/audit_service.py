from apps.documents.models import Document


class AuditService:
    @staticmethod
    def log(application, action: str, details: dict = None):
        from apps.applications.models import AuditLog
        AuditLog.objects.create(
            application=application,
            action=action,
            details=details or {},
        )

    @staticmethod
    def log_upload(application, document: Document):
        AuditService.log(application, "DOCUMENT_UPLOADED", {
            "document_id": document.id,
            "document_type": document.type,
            "file_name": document.file_name,
            "file_size": document.file_size,
        })

    @staticmethod
    def log_evaluation(application, evaluation):
        AuditService.log(application, "AI_EVALUATION_COMPLETED", {
            "evaluation_id": evaluation.id,
            "total_score": evaluation.total_score,
            "risk_level": evaluation.risk_level,
        })

    @staticmethod
    def log_reviewer_action(application, action: str, reviewer_id: int, comment: str = None):
        AuditService.log(application, f"REVIEWER_{action}", {
            "reviewer_id": reviewer_id,
            "comment": comment,
        })

    @staticmethod
    def log_status_change(application, old_status: str, new_status: str):
        AuditService.log(application, "STATUS_CHANGE", {
            "from": old_status,
            "to": new_status,
        })
