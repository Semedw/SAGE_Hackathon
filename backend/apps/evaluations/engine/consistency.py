import re
from .base import CriterionEvaluator, CriterionResult


class ConsistencyEvaluator(CriterionEvaluator):
    weight = 0.20
    name = "Data Consistency"

    LINE_RE = r"([^\n]+)"

    def _extract_names(self, text: str) -> list:
        names = []
        patterns = [
            r"(?:Name|Full Name|Applicant Name|Patient Name|Insured Name)[:\s]*([A-Za-z\.' ]+?)(?:\n|$)",
            r"^([A-Z][a-z]+ [A-Z][a-z]+)(?:\s*\n|$)",
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for m in matches:
                cleaned = m.strip()
                if cleaned and len(cleaned) > 3 and len(cleaned) < 60:
                    names.append(cleaned)
        return names[:5]

    def _extract_addresses(self, text: str) -> list:
        addrs = []
        patterns = [
            r"(?:Address|Residence|Living at)[:\s]*([A-Za-z0-9,\.\#\- ]+?)(?:\n|$)",
            r"\b\d+\s+[A-Za-z ]+(?:Street\b|St\b|Avenue\b|Ave\b|Road\b|Rd\b|Drive\b|Dr\b|Lane\b|Ln\b)[A-Za-z, ]*",
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for m in matches:
                cleaned = m.strip().rstrip(",")
                if cleaned and len(cleaned) > 5 and len(cleaned) < 100:
                    addrs.append(cleaned)
        return addrs[:3]

    def _extract_dates(self, text: str) -> list:
        dates = []
        patterns = [
            r"(?:Date of Birth|DOB|Birth Date|Issued|Expiry|Date)[:\s]*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            dates.extend(matches)
        return dates[:3]

    def _extract_id_numbers(self, text: str) -> list:
        ids = []
        patterns = [
            r"(?:ID|SSN|Passport|License|Policy No|Policy Number|Policy)[:\s]*([A-Z0-9\-]{3,30})(?:\s*\n|$)",
            r"\b\d{3}[-]\d{2}[-]\d{4}\b",
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            ids.extend(matches)
        return ids[:3]

    def _fuzzy_match(self, a: str, b: str) -> float:
        a, b = a.lower().strip(), b.lower().strip()
        if not a or not b:
            return 0.0
        try:
            from Levenshtein import ratio
            return ratio(a, b)
        except ImportError:
            if len(a) < 3 or len(b) < 3:
                return 0.0
            matches = sum(1 for i, c in enumerate(a) if i < len(b) and c == b[i])
            return matches / max(len(a), len(b))

    def _cross_check_field(self, field_name: str, values_per_doc: dict) -> dict:
        all_values = []
        for doc_id, values in values_per_doc.items():
            for v in values:
                all_values.append((doc_id, v))

        issues = []
        score = 1.0

        if len(all_values) < 2:
            return {"score": 1.0, "issues": [], "values_found": len(all_values)}

        matches = []
        for i in range(len(all_values)):
            for j in range(i + 1, len(all_values)):
                doc_i, val_i = all_values[i]
                doc_j, val_j = all_values[j]
                if doc_i == doc_j:
                    continue
                match = self._fuzzy_match(val_i, val_j)
                matches.append(match)
                if match < 0.6:
                    issues.append(
                        f"{field_name} mismatch: "
                        f"'{val_i}' vs '{val_j}'"
                    )

        score = sum(matches) / len(matches) if matches else 1.0
        return {"score": round(score, 4), "issues": issues, "values_found": len(all_values)}

    def evaluate(self, application, documents) -> CriterionResult:
        issues = []
        details = {}

        names_per_doc = {}
        addresses_per_doc = {}
        dates_per_doc = {}
        ids_per_doc = {}

        for doc in documents:
            text = doc.ocr_text or ""
            if not text:
                continue
            names_per_doc[doc.id] = self._extract_names(text)
            addresses_per_doc[doc.id] = self._extract_addresses(text)
            dates_per_doc[doc.id] = self._extract_dates(text)
            ids_per_doc[doc.id] = self._extract_id_numbers(text)

        checks = [
            ("Name", names_per_doc),
            ("Address", addresses_per_doc),
            ("Date", dates_per_doc),
            ("ID Number", ids_per_doc),
        ]

        consistency_scores = []
        for field_name, values in checks:
            result = self._cross_check_field(field_name, values)
            consistency_scores.append(result["score"])
            issues.extend(result["issues"])
            details[field_name.lower()] = result

        score = sum(consistency_scores) / len(consistency_scores) if consistency_scores else 1.0

        return CriterionResult(
            score=round(score, 4),
            issues=issues,
            details=details,
        )
