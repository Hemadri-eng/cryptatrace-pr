from datetime import datetime
from app.services.blockchain.mock_provider import get_provider, KNOWN_ENTITIES
from app.services.risk_engine.rule_engine import get_risk_engine


def run_investigation(wallet_or_start_address: str) -> dict:
    """Runs the full simulated pipeline for a given wallet address and
    returns everything needed to persist an Investigation + Evidence set."""
    provider = get_provider()
    engine = get_risk_engine()

    graph = provider.trace_funds(wallet_or_start_address)
    risk_result = engine.score(graph)

    entity_addr = graph["probable_entity_address"]
    entity_info = KNOWN_ENTITIES[entity_addr]
    # Confidence deterministically derived from address hash for demo consistency
    confidence = round(65 + (hash(entity_addr) % 26), 1)  # 65-90%

    reasoning = (
        f"The final traced hop deposits funds into an address attributed to "
        f"{entity_info['name']}, a {entity_info['type'].replace('_', ' ')} in the simulated "
        f"entity watchlist, based on address-clustering heuristics in this demo dataset."
    )

    num_hops = len([e for e in graph["edges"] if e["id"].startswith("e-") and e["id"][2].isdigit()])
    summary = (
        f"The submitted wallet shows multiple indicators consistent with layered fund movement. "
        f"Funds were traced across {num_hops} connected wallets before reaching a probable "
        f"{entity_info['type'].replace('_', ' ')} destination ({entity_info['name']}). "
        f"Overall risk is assessed as {risk_result['level']} ({risk_result['score']}/100)."
    )

    # Timeline: chronological list of edge events + entity attribution event
    timeline = []
    for e in sorted(graph["edges"], key=lambda x: x["timestamp"]):
        timeline.append({
            "timestamp": e["timestamp"],
            "event": f"{e['amount']} {e['token']} transferred",
            "detail": f"{e['source'][:10]}... → {e['target'][:10]}...",
            "tx_hash": e["hash"],
        })
    timeline.append({
        "timestamp": graph["edges"][-1]["timestamp"],
        "event": "Probable exchange identified",
        "detail": f"{entity_info['name']} (confidence {confidence}%)",
        "tx_hash": None,
    })

    # Evidence: one record per edge, mapped to a supported finding
    evidence_items = []
    finding_titles = [f["title"] for f in risk_result["findings"]]
    default_finding = finding_titles[0] if finding_titles else "Fund Trace"
    for i, e in enumerate(graph["edges"]):
        supported = default_finding
        if e["id"] == "e-branch-d":
            supported = "Fan-Out" if "Fan-Out" in finding_titles else default_finding
        elif e["id"] == "e-fanin-e":
            supported = "Suspicious Clustering (Fan-In)" if "Suspicious Clustering (Fan-In)" in finding_titles else default_finding
        elif e["id"] == "e-final":
            supported = "Exchange Interaction" if "Exchange Interaction" in finding_titles else default_finding
        evidence_items.append({
            "evidence_code": f"EVD-{i+1:03d}",
            "evidence_type": "transaction",
            "transaction_hash": e["hash"],
            "source_wallet": e["source"],
            "destination_wallet": e["target"],
            "amount": e["amount"],
            "token": e["token"],
            "timestamp": e["timestamp"],
            "blockchain": e["network"],
            "finding_supported": supported,
        })

    return {
        "graph": {"nodes": graph["nodes"], "edges": graph["edges"]},
        "risk_score": risk_result["score"],
        "risk_level": risk_result["level"],
        "risk_factors": risk_result["factors"],
        "findings": risk_result["findings"],
        "probable_entity_name": entity_info["name"],
        "probable_entity_confidence": confidence,
        "probable_entity_reasoning": reasoning,
        "executive_summary": summary,
        "timeline": timeline,
        "evidence_items": evidence_items,
    }
