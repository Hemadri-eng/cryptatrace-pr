"""
Deterministic simulated blockchain data provider.

IMPORTANT: All addresses/entities here are FICTIONAL DEMO DATA.
No real wallet, exchange, or transaction is represented. Given the
same input address, this provider always returns the same graph so
that demos are reproducible.
"""
import hashlib
import random
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# Simulated known-entity attribution dataset (DEMO DATA ONLY)
# ---------------------------------------------------------------------------
KNOWN_ENTITIES = {
    "0xEXCH0BINANCE00000000000000000000000001": {"name": "Binance (Simulated)", "type": "exchange", "risk": "low"},
    "0xEXCH0COINBASE0000000000000000000000002": {"name": "Coinbase (Simulated)", "type": "exchange", "risk": "low"},
    "0xEXCH0KRAKEN000000000000000000000000003": {"name": "Kraken (Simulated)", "type": "exchange", "risk": "low"},
    "0xEXCH0OKX000000000000000000000000000004": {"name": "OKX (Simulated)", "type": "exchange", "risk": "medium"},
    "0xVASP0UNKNOWN0000000000000000000000005": {"name": "Unknown VASP (Simulated)", "type": "unknown_vasp", "risk": "high"},
    "0xMIXER0TORNADO000000000000000000000006": {"name": "Mixer Service (Simulated)", "type": "mixer", "risk": "critical"},
    "0xSUSP0SERVICE0000000000000000000000007": {"name": "Suspicious Service (Simulated)", "type": "suspicious_service", "risk": "critical"},
}
ENTITY_ADDRESSES = list(KNOWN_ENTITIES.keys())

NETWORKS = ["Ethereum", "BSC", "Polygon", "Tron"]
TOKENS = ["ETH", "USDT", "USDC", "BNB", "MATIC"]


def _seeded_rng(seed_str: str) -> random.Random:
    h = hashlib.sha256(seed_str.encode()).hexdigest()
    return random.Random(int(h, 16))


def _fake_address(rng: random.Random, tag: str) -> str:
    h = hashlib.sha256(f"{tag}-{rng.random()}".encode()).hexdigest()[:38]
    return "0x" + h


def _fake_tx_hash(rng: random.Random, src: str, dst: str) -> str:
    h = hashlib.sha256(f"{src}-{dst}-{rng.random()}".encode()).hexdigest()
    return "0x" + h


class MockBlockchainProvider:
    """Deterministic simulated on-chain data + fund-tracing engine."""

    def get_wallet_transactions(self, address: str) -> list[dict]:
        graph = self.trace_funds(address)
        return [e for e in graph["edges"] if e["source"] == address or e["target"] == address]

    def get_transaction(self, tx_hash: str) -> dict | None:
        # Deterministically derive a plausible source wallet from the tx hash,
        # then trace from it, so entering a tx hash behaves like entering a wallet.
        rng = _seeded_rng(tx_hash)
        pseudo_source = _fake_address(rng, "victim-from-tx")
        graph = self.trace_funds(pseudo_source)
        first_edge = graph["edges"][0] if graph["edges"] else None
        return {
            "hash": tx_hash,
            "from": pseudo_source,
            "to": first_edge["target"] if first_edge else None,
            "amount": first_edge["amount"] if first_edge else 0,
            "token": first_edge["token"] if first_edge else "ETH",
            "network": first_edge["network"] if first_edge else "Ethereum",
            "timestamp": first_edge["timestamp"] if first_edge else datetime.utcnow().isoformat(),
        }

    def trace_funds(self, start_address: str, max_hops: int = 4) -> dict:
        """Builds a deterministic directed multi-hop graph starting from
        start_address, ending at a probable exchange/VASP entity.
        Cycle-safe: a visited-set guards traversal, and the synthetic
        chain is generated forward-only so no cycles are possible."""
        rng = _seeded_rng(start_address)
        network = rng.choice(NETWORKS)
        token = rng.choice(TOKENS)

        nodes = []
        edges = []
        visited = set()

        def add_node(addr, entity_type, label=None, extra=None):
            if addr in visited:
                return
            visited.add(addr)
            entity = KNOWN_ENTITIES.get(addr)
            node = {
                "id": addr,
                "label": label or (entity["name"] if entity else addr[:10] + "..."),
                "type": entity_type,
                "risk": entity["risk"] if entity else extra.get("risk", "low") if extra else "low",
                "first_seen": extra.get("first_seen") if extra else None,
                "last_seen": extra.get("last_seen") if extra else None,
                "balance": extra.get("balance") if extra else None,
                "tx_count": extra.get("tx_count") if extra else None,
            }
            nodes.append(node)

        base_time = datetime(2026, 1, 15, 9, 0, 0)

        # Victim wallet (the reported address itself)
        add_node(
            start_address, "victim",
            extra={"first_seen": (base_time - timedelta(days=40)).isoformat(),
                   "last_seen": base_time.isoformat(), "balance": round(rng.uniform(0.1, 5), 3),
                   "tx_count": rng.randint(3, 40)},
        )

        # Main chain: victim -> A -> B -> C -> exchange
        chain_labels = ["A", "B", "C"]
        prev = start_address
        t = base_time
        chain_addrs = []
        for i, label in enumerate(chain_labels):
            addr = _fake_address(rng, f"wallet-{label}-{start_address}")
            chain_addrs.append(addr)
            t = t + timedelta(minutes=rng.randint(4, 25))
            amount = round(rng.uniform(0.3, 3.5), 4)
            add_node(
                addr, "intermediate", label=f"Wallet {label}",
                extra={"first_seen": (t - timedelta(days=rng.randint(0, 3))).isoformat(),
                       "last_seen": t.isoformat(), "balance": round(rng.uniform(0, 2), 3),
                       "tx_count": rng.randint(1, 12)},
            )
            edges.append({
                "id": f"e-{i}",
                "source": prev,
                "target": addr,
                "amount": amount,
                "token": token,
                "network": network,
                "timestamp": t.isoformat(),
                "hash": _fake_tx_hash(rng, prev, addr),
            })
            prev = addr

        # Branch: Wallet A fans out to Wallet D (fan-out behaviour signal)
        wallet_d = _fake_address(rng, f"wallet-D-{start_address}")
        t_branch = base_time + timedelta(minutes=rng.randint(5, 15))
        add_node(
            wallet_d, "intermediate", label="Wallet D",
            extra={"first_seen": t_branch.isoformat(), "last_seen": t_branch.isoformat(),
                   "balance": round(rng.uniform(0, 1), 3), "tx_count": rng.randint(1, 5)},
        )
        edges.append({
            "id": "e-branch-d",
            "source": chain_addrs[0],
            "target": wallet_d,
            "amount": round(rng.uniform(0.1, 1.0), 4),
            "token": token,
            "network": network,
            "timestamp": t_branch.isoformat(),
            "hash": _fake_tx_hash(rng, chain_addrs[0], wallet_d),
        })

        # Fan-in signal: an extra unrelated-looking wallet also feeds Wallet B
        wallet_e = _fake_address(rng, f"wallet-E-{start_address}")
        t_fanin = base_time + timedelta(minutes=rng.randint(10, 20))
        add_node(
            wallet_e, "unknown", label="Wallet E",
            extra={"first_seen": t_fanin.isoformat(), "last_seen": t_fanin.isoformat(),
                   "balance": round(rng.uniform(0, 0.5), 3), "tx_count": rng.randint(1, 3)},
        )
        edges.append({
            "id": "e-fanin-e",
            "source": wallet_e,
            "target": chain_addrs[1],
            "amount": round(rng.uniform(0.05, 0.8), 4),
            "token": token,
            "network": network,
            "timestamp": t_fanin.isoformat(),
            "hash": _fake_tx_hash(rng, wallet_e, chain_addrs[1]),
        })

        # Final hop: Wallet C -> probable exchange/entity
        entity_addr = rng.choice(ENTITY_ADDRESSES)
        t_final = t + timedelta(minutes=rng.randint(3, 10))
        add_node(entity_addr, KNOWN_ENTITIES[entity_addr]["type"])
        final_amount = round(rng.uniform(0.5, 3.0), 4)
        edges.append({
            "id": "e-final",
            "source": chain_addrs[-1],
            "target": entity_addr,
            "amount": final_amount,
            "token": token,
            "network": network,
            "timestamp": t_final.isoformat(),
            "hash": _fake_tx_hash(rng, chain_addrs[-1], entity_addr),
        })

        return {
            "nodes": nodes,
            "edges": edges,
            "network": network,
            "token": token,
            "probable_entity_address": entity_addr,
            "chain_addrs": chain_addrs,
            "branch_addr": wallet_d,
            "fanin_addr": wallet_e,
        }

    def identify_entities(self, addresses: list[str]) -> dict:
        result = {}
        for addr in addresses:
            if addr in KNOWN_ENTITIES:
                result[addr] = {**KNOWN_ENTITIES[addr], "confidence": 0.9}
        return result


def get_provider():
    """Factory - reads BLOCKCHAIN_PROVIDER env var. Only 'mock' is implemented
    in this prototype; a real EVM provider can be added at evm_provider.py
    and selected here without changing any calling code."""
    from app.core.config import settings
    if settings.BLOCKCHAIN_PROVIDER == "mock":
        return MockBlockchainProvider()
    # Future: elif settings.BLOCKCHAIN_PROVIDER == "evm": return EvmProvider()
    return MockBlockchainProvider()
