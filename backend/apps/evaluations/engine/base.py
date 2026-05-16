from dataclasses import dataclass, field
from typing import List


@dataclass
class CriterionResult:
    score: float
    issues: List[str] = field(default_factory=list)
    details: dict = field(default_factory=dict)


class CriterionEvaluator:
    weight: float = 0.0
    name: str = ""

    def evaluate(self, application, documents) -> CriterionResult:
        raise NotImplementedError
