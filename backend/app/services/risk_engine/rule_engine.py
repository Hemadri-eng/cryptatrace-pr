from datetime import datetime
from app.services.blockchain.mock_provider import KNOWN_ENTITIES


def _risk_level(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MEDIUM"
    return "LOW"


class RuleEngine:
    """Deterministic, explainable rule-based risk scoring.
    Designed so a future MLEngine can be swapped in behind the same
    interface (score(graph) -> {score, level, factors, findings})."""

    def score(self, graph: dict) -> dict:
        edges = graph["edges"]
        nodes = {n["id"]: n for n in graph["nodes"]}
        factors = []
        findings = []
        total = 0

        num_hops = len([e for e in edges if e["id"].startswith("e-") and e["id"][2].isdigit()])

        # 1. Multi-hop movement
        if num_hops >= 3:
            weight = 20
            total += weight
            factors.append({"label": "Multi-hop movement", "weight": weight,
                             "detail": f"Funds passed through {num_hops} hops before reaching a probable exit point."})
            findings.append({
                "title": "Layering",
                "severity": "high",
                "description": f"Funds moved through {num_hops} intermediate wallets, consistent with layering to obscure origin.",
                "risk_contribution": weight,
            })

        # 2. Rapid fund movement (time between first and last hop of main chain)
        timestamps = sorted(datetime.fromisoformat(e["timestamp"]) for e in edges if e["id"].startswith("e-") and e["id"][2].isdigit())
        if len(timestamps) >= 2:
            delta_minutes = (timestamps[-1] - timestamps[0]).total_seconds() / 60
            if delta_minutes <= 45:
                weight = 18
                total += weight
                factors.append({"label": "Rapid fund movement", "weight": weight,
                                 "detail": f"Funds moved through {len(timestamps)} wallets within {int(delta_minutes)} minutes."})
                findings.append({
                    "title": "Rapid Fund Movement",
                    "severity": "high",
                    "description": f"Funds moved through {len(timestamps)} wallets within {int(delta_minutes)} minutes.",
                    "risk_contribution": weight,
                })

        # 3. Fan-out (one wallet -> many)
        out_degree = {}
        for e in edges:
            out_degree[e["source"]] = out_degree.get(e["source"], 0) + 1
        fan_out_nodes = [addr for addr, cnt in out_degree.items() if cnt >= 2]
        if fan_out_nodes:
            weight = 14
            total += weight
            factors.append({"label": "Fan-out behaviour", "weight": weight,
                             "detail": f"{len(fan_out_nodes)} wallet(s) distributed funds to multiple destinations."})
            findings.append({
                "title": "Fan-Out",
                "severity": "medium",
                "description": "A wallet in the trace sent funds to multiple downstream wallets, a pattern used to split and obscure fund flow.",
                "risk_contribution": weight,
            })

        # 4. Fan-in (many -> one wallet)
        in_degree = {}
        for e in edges:
            in_degree[e["target"]] = in_degree.get(e["target"], 0) + 1
        fan_in_nodes = [addr for addr, cnt in in_degree.items() if cnt >= 2]
        if fan_in_nodes:
            weight = 12
            total += weight
            factors.append({"label": "Fan-in / clustering", "weight": weight,
                             "detail": f"{len(fan_in_nodes)} wallet(s) received funds from multiple distinct sources."})
            findings.append({
                "title": "Suspicious Clustering (Fan-In)",
                "severity": "medium",
                "description": "Multiple distinct wallets funneled funds into a single wallet in the trace, consistent with fund aggregation.",
                "risk_contribution": weight,
            })

        # 5. High-risk entity interaction (mixer / suspicious service / unknown vasp)
        high_risk_entities = [
            n for n in nodes.values() if n.get("risk") in ("high", "critical")
        ]
        if high_risk_entities:
            weight = 15
            total += weight
            names = ", ".join(n["label"] for n in high_risk_entities)
            factors.append({"label": "High-risk entity interaction", "weight": weight,
                             "detail": f"Trace interacts with high-risk entity: {names}."})
            findings.append({
                "title": "High-Risk Entity Interaction",
                "severity": "critical",
                "description": f"The fund flow interacts with an entity classified as high risk: {names}.",
                "risk_contribution": weight,
            })

        # 6. Known suspicious address (any node matches KNOWN_ENTITIES with elevated risk)
        known_suspicious = [addr for addr in nodes if addr in KNOWN_ENTITIES and KNOWN_ENTITIES[addr]["risk"] in ("medium", "high", "critical")]
        if known_suspicious:
            weight = 10
            total += weight
            factors.append({"label": "Known suspicious address", "weight": weight,
                             "detail": "One or more addresses in the trace match a known flagged entity in the demo watchlist."})

        # 7. Exchange proximity (final hop reaches a known exchange/VASP)
        exchange_nodes = [n for n in nodes.values() if n.get("type") in ("exchange", "unknown_vasp", "mixer", "suspicious_service")]
        if exchange_nodes:
            weight = 10
            total += weight
            factors.append({"label": "Exchange / VASP proximity", "weight": weight,
                             "detail": "Trace terminates at a probable exchange or virtual asset service provider."})
            findings.append({
                "title": "Exchange Interaction",
                "severity": "medium",
                "description": f"Fund trace terminates at {exchange_nodes[0]['label']}, a probable cash-out point.",
                "risk_contribution": weight,
            })

        # 8. Dormant-to-active (victim wallet had few tx then suddenly active)
        victim_nodes = [n for n in nodes.values() if n.get("type") == "victim"]
        if victim_nodes and (victim_nodes[0].get("tx_count") or 0) < 6:
            weight = 8
            total += weight
            factors.append({"label": "Dormant-to-active wallet", "weight": weight,
                             "detail": "Reported wallet had minimal prior activity before this transaction burst."})
            findings.append({
                "title": "Dormant-to-Active",
                "severity": "low",
                "description": "The reported wallet showed little prior activity before suddenly transacting, a pattern sometimes seen in mule or drop accounts.",
                "risk_contribution": weight,
            })

        score = min(100, total)
        level = _risk_level(score)

        return {
            "score": score,
            "level": level,
            "factors": factors,
            "findings": findings,
        }


def get_risk_engine():
    """Factory - currently always returns RuleEngine. A future MLEngine
    implementing the same RiskEngine interface can be swapped in here
    once labelled case data is available."""
    return RuleEngine()
