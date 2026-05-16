from .base import CriterionEvaluator, CriterionResult


class CompletenessEvaluator(CriterionEvaluator):
    weight = 0.30
    name = "Document Completeness"

    REQUIRED_DOCS = {"ID_CARD", "INCOME_PROOF", "INSURANCE_FORM"}
    OPTIONAL_DOCS = {"ADDRESS_PROOF", "MEDICAL_RECORD", "SUPPORTING"}

    def evaluate(self, application, documents) -> CriterionResult:
        issues = []
        details = {}

        uploaded_types = set(doc.type for doc in documents)
        details["uploaded"] = list(uploaded_types)

        missing_required = self.REQUIRED_DOCS - uploaded_types
        present_required = self.REQUIRED_DOCS & uploaded_types
        present_optional = self.OPTIONAL_DOCS & uploaded_types

        details["missing_required"] = list(missing_required)
        details["present_required"] = list(present_required)
        details["present_optional"] = list(present_optional)

        for doc_type in missing_required:
            issues.append(f"Missing required document: {doc_type.replace('_', ' ').title()}")

        required_ratio = len(present_required) / len(self.REQUIRED_DOCS)
        optional_bonus = min(0.2, len(present_optional) * 0.1)
        score = min(1.0, required_ratio + optional_bonus)

        if len(documents) == 0:
            issues.append("No documents uploaded")
            score = 0.0

        details["required_ratio"] = round(required_ratio, 4)
        details["optional_bonus"] = round(optional_bonus, 4)

        return CriterionResult(
            score=round(score, 4),
            issues=issues,
            details=details,
        )
