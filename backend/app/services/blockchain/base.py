from abc import ABC, abstractmethod


class BlockchainProvider(ABC):
    """Abstract interface any blockchain data provider must implement.
    Swap MockProvider for a real EVM provider later without touching
    any calling code (risk engine, API routes, frontend)."""

    @abstractmethod
    def get_wallet_transactions(self, address: str) -> list[dict]:
        ...

    @abstractmethod
    def get_transaction(self, tx_hash: str) -> dict | None:
        ...

    @abstractmethod
    def trace_funds(self, start_address: str, max_hops: int = 4) -> dict:
        """Returns {"nodes": [...], "edges": [...]} directed graph."""
        ...

    @abstractmethod
    def identify_entities(self, addresses: list[str]) -> dict:
        """Returns {address: {"name": str, "type": str, "confidence": float}}"""
        ...
