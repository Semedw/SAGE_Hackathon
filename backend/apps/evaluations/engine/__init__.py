from .base import CriterionResult
from .completeness import CompletenessEvaluator
from .consistency import ConsistencyEvaluator
from .quality import QualityEvaluator
from .identity import IdentityEvaluator
from .risk import RiskEvaluator


class ScoringEngine:
    def __init__(self):
        self.evaluators = [
            CompletenessEvaluator(),
            ConsistencyEvaluator(),
            QualityEvaluator(),
            IdentityEvaluator(),
            RiskEvaluator(),
        ]

    def evaluate(self, application, documents) -> dict:
        results = {}

        for evaluator in self.evaluators:
            result = evaluator.evaluate(application, documents)
            results[evaluator.name] = {
                "score": result.score,
                "weight": evaluator.weight,
                "weighted_score": round(result.score * evaluator.weight, 4),
                "issues": result.issues,
                "details": result.details,
            }

        total_score = sum(
            r["weighted_score"] for r in results.values()
        ) * 100

        all_issues = []
        for name, r in results.items():
            for issue in r["issues"]:
                all_issues.append(f"[{name}] {issue}")

        issue_count = len(all_issues)
        confidence = max(0.0, 1.0 - (issue_count * 0.05))
        confidence = min(1.0, confidence)

        if total_score >= 80:
            risk_level = "LOW"
        elif total_score >= 50:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        summary = self._generate_summary(results, total_score, risk_level, all_issues)

        return {
            "total_score": round(total_score, 2),
            "confidence": round(confidence, 4),
            "risk_level": risk_level,
            "criteria": results,
            "issues": all_issues,
            "summary": summary,
            "suggested_review_areas": self._get_review_areas(results, risk_level),
        }

    def _generate_summary(self, results, total_score, risk_level, issues) -> str:
        parts = []

        if total_score >= 80:
            parts.append("Application looks good overall.")
        elif total_score >= 50:
            parts.append("Application has some issues that need attention.")
        else:
            parts.append("Application has significant issues requiring thorough review.")

        completeness = results.get("Document Completeness", {})
        if completeness.get("score", 1) < 0.8:
            missing = completeness.get("details", {}).get("missing_required", [])
            if missing:
                parts.append(
                    f"Missing documents: {', '.join(m.replace('_', ' ').title() for m in missing)}."
                )

        consistency = results.get("Data Consistency", {})
        if consistency.get("score", 1) < 0.7:
            parts.append("Data inconsistencies found across documents.")

        quality = results.get("Document Quality", {})
        if quality.get("score", 1) < 0.6:
            parts.append("Document quality issues detected (blurry or low resolution).")

        risk = results.get("Risk Assessment", {})
        if risk.get("details", {}).get("risk_flags"):
            parts.append("Risk flags have been raised.")

        if not issues:
            parts.append("No issues detected.")

        return " ".join(parts)

    def _get_review_areas(self, results, risk_level) -> list:
        areas = []
        for name, r in results.items():
            if r["score"] < 0.7:
                areas.append(f"Review {name.lower()} - score: {r['score']:.0%}")
        if risk_level != "LOW":
            areas.append("Manual verification recommended due to risk level")
        return areas


engine = ScoringEngine()
