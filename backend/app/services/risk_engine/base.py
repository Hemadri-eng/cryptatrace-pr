from abc import ABC, abstractmethod


class RiskEngine(ABC):
    @abstractmethod
    def score(self, graph: dict) -> dict:
        """Returns {"score": int, "level": str, "factors": [...], "findings": [...]}"""
        ...
