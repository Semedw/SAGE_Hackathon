import re
from .base import CriterionEvaluator, CriterionResult


class IdentityEvaluator(CriterionEvaluator):
    weight = 0.15
    name = "Identity Verification"

    ID_PATTERNS = {
        "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
        "DRIVERS_LICENSE": r"\b[A-Z]{1,2}\d{4,8}\b",
        "PASSPORT": r"\b[A-Z]{1,2}\d{6,9}\b",
        "NATIONAL_ID": r"\b\d{5,12}\b",
    }

    def _check_id_patterns(self, text: str) -> dict:
        found = {}
        for id_type, pattern in self.ID_PATTERNS.items():
            matches = re.findall(pattern, text)
            if matches:
                found[id_type] = matches
        return found

    def _extract_face_indicators(self, text: str) -> bool:
        indicators = [
            r"photo", r"picture", r"image", r"face", r"portrait",
            r"passport photo", r"ID photo", r"profile photo",
        ]
        for indicator in indicators:
            if re.search(indicator, text, re.IGNORECASE):
                return True
        return False

    def evaluate(self, application, documents) -> CriterionResult:
        issues = []
        details = {}

        id_docs = [d for d in documents if d.type == "ID_CARD"]
        if not id_docs:
            issues.append("No ID document uploaded for identity verification")
            return CriterionResult(
                score=0.0,
                issues=issues,
                details={"id_doc_present": False},
            )

        details["id_doc_present"] = True
        id_text = " ".join(d.ocr_text or "" for d in id_docs)

        patterns_found = self._check_id_patterns(id_text)
        details["id_patterns_found"] = patterns_found

        has_face_indicators = self._extract_face_indicators(id_text)
        details["face_photo_indicators"] = has_face_indicators

        score = 0.0
        if patterns_found:
            score += 0.5
        else:
            issues.append("No recognizable ID number patterns found")

        if has_face_indicators:
            score += 0.3
        else:
            issues.append("No face photo indicators detected on ID (may still be valid)")

        identity_docs = [
            d for d in documents
            if d.type in ("ID_CARD", "INSURANCE_FORM")
            and d.ocr_text
        ]

        if len(identity_docs) >= 2:
            names = []
            for doc in identity_docs:
                match = re.search(
                    r"(?:Name|Full Name|Applicant Name)[:\s]*([A-Za-z\.\s']+?)(?:\n|$)",
                    doc.ocr_text, re.IGNORECASE
                )
                if match:
                    names.append(match.group(1).strip())

            if len(names) >= 2:
                from Levenshtein import ratio
                name_match = ratio(
                    names[0].lower(), names[1].lower()
                )
                details["name_match_ratio"] = round(name_match, 4)
                if name_match >= 0.8:
                    score += 0.2
                else:
                    issues.append(
                        f"Name mismatch between ID and insurance form: "
                        f"'{names[0]}' vs '{names[1]}'"
                    )
            else:
                score += 0.1
        else:
            score += 0.1

        score = min(1.0, score)

        return CriterionResult(
            score=round(score, 4),
            issues=issues,
            details=details,
        )
