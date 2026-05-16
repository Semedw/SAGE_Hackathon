import re
from .base import CriterionEvaluator, CriterionResult


class RiskEvaluator(CriterionEvaluator):
    weight = 0.15
    name = "Risk Assessment"

    def evaluate(self, application, documents) -> CriterionResult:
        issues = []
        details = {}
        risk_flags = []
        score = 1.0

        ocr_texts = [d.ocr_text or "" for d in documents if d.ocr_text]
        combined_text = " ".join(ocr_texts)

        suspicious_patterns = [
            (r"\d{3}[-]?\d{2}[-]?\d{4}", "Multiple SSN-like patterns detected"),
            (r"(?:urgent|immediate|asap|quick approval)", "Urgency language detected"),
            (r"(?:fake|forged|altered|modified)", "Potential tampering language detected"),
        ]

        for pattern, msg in suspicious_patterns:
            matches = re.findall(pattern, combined_text, re.IGNORECASE)
            if len(matches) > 1:
                risk_flags.append(msg)

        missing_types = set()
        for doc in documents:
            if doc.ocr_text is None or doc.ocr_text.strip() == "":
                missing_types.add(doc.get_type_display() + " (no text extracted)")

        if missing_types:
            issues.extend(missing_types)

        doc_count = len(documents)
        if doc_count > 8:
            risk_flags.append(f"Unusually high number of documents ({doc_count})")
            score *= 0.7

        if doc_count < 2:
            risk_flags.append("Very few documents uploaded")
            score *= 0.7

        if application.status == "CORRECTION_NEEDED":
            risk_flags.append("Application has been flagged for correction before")
            score *= 0.85

        has_blurry = any(getattr(d, "is_blurry", False) for d in documents)
        if has_blurry:
            risk_flags.append("At least one document is blurry (possible phone photo of screen)")

        low_conf_docs = [
            d for d in documents
            if d.ocr_confidence is not None and d.ocr_confidence < 0.4
        ]
        if len(low_conf_docs) >= 2:
            risk_flags.append(
                f"Multiple documents ({len(low_conf_docs)}) have very low OCR confidence"
            )
            score *= 0.7

        addresses = set()
        names = set()
        for d in documents:
            text = d.ocr_text or ""
            addr_match = re.search(r"Address[:\s]*([A-Za-z0-9,\.\#\- ]+?)(?:\n|$)", text, re.IGNORECASE)
            if addr_match:
                addresses.add(addr_match.group(1).strip())
            name_match = re.search(r"(?:Name|Full Name)[:\s]*([A-Za-z\.\s']+?)\n", text, re.IGNORECASE)
            if name_match:
                names.add(name_match.group(1).strip())

        if len(addresses) > 1:
            risk_flags.append(f"Conflicting addresses across documents ({len(addresses)} different)")
            score *= 0.6

        if len(names) > 1:
            risk_flags.append("Multiple different names found across documents")

        for flag in risk_flags:
            issues.append(f"Risk flag: {flag}")

        details["risk_flags"] = risk_flags
        details["doc_count"] = doc_count
        details["has_blurry"] = has_blurry
        details["low_confidence_count"] = len(low_conf_docs)
        details["unique_addresses"] = list(addresses)
        details["unique_names"] = list(names)

        return CriterionResult(
            score=round(score, 4),
            issues=issues,
            details=details,
        )
