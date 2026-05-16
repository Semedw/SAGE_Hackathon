from .base import CriterionEvaluator, CriterionResult


class QualityEvaluator(CriterionEvaluator):
    weight = 0.20
    name = "Document Quality"

    def evaluate(self, application, documents) -> CriterionResult:
        issues = []
        details = {}

        if not documents:
            return CriterionResult(score=0.0, issues=["No documents uploaded"], details={})

        quality_scores = []
        for doc in documents:
            doc_issues = []
            doc_score = 1.0

            if doc.is_blurry:
                doc_issues.append(f"{doc.get_type_display()} is blurry")
                doc_score *= 0.4

            if doc.quality_score is not None:
                doc_score *= doc.quality_score
            elif doc.ocr_confidence is not None:
                doc_score *= doc.ocr_confidence

            if doc.ocr_confidence is not None and doc.ocr_confidence < 0.5:
                doc_issues.append(
                    f"{doc.get_type_display()} has low OCR confidence ({doc.ocr_confidence:.0%})"
                )
                doc_score *= 0.6

            quality_scores.append(doc_score)
            details[f"doc_{doc.id}"] = {
                "type": doc.type,
                "score": round(doc_score, 4),
                "issues": doc_issues,
                "blurry": doc.is_blurry,
                "ocr_confidence": doc.ocr_confidence,
                "quality_score": doc.quality_score,
            }
            issues.extend(doc_issues)

        score = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0

        return CriterionResult(
            score=round(score, 4),
            issues=issues,
            details=details,
        )
