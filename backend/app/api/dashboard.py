from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.models import Case, Investigation, User, AuditLog, RiskLevelEnum
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Case)
    if user.role.value != "SUPER_ADMIN":
        q = q.filter(Case.institution_id == user.institution_id)

    total_cases = q.count()
    open_cases = q.filter(Case.status.in_(["Submitted", "Under Investigation", "High Risk"])).count()
    high_risk_cases = q.filter(Case.risk_level.in_([RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL])).count()

    inv_q = db.query(Investigation)
    if user.role.value != "SUPER_ADMIN":
        inv_q = inv_q.filter(Investigation.institution_id == user.institution_id)
    investigations_completed = inv_q.count()

    suspicious_wallets = q.filter(Case.wallet_address.isnot(None)).filter(
        Case.risk_level.in_([RiskLevelEnum.MEDIUM, RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL])
    ).count()

    exchanges_identified = inv_q.filter(Investigation.probable_entity_name.isnot(None)).distinct(
        Investigation.probable_entity_name
    ).count()

    risk_distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for level, in q.filter(Case.risk_level.isnot(None)).with_entities(Case.risk_level).all():
        risk_distribution[level.value] += 1

    recent_cases = q.order_by(Case.created_at.desc()).limit(8).all()
    recent_cases_out = [{
        "id": c.id,
        "case_number": c.case_number,
        "reported_date": c.created_at.isoformat(),
        "wallet_or_tx": c.wallet_address or c.transaction_hash,
        "risk_level": c.risk_level.value if c.risk_level else None,
        "status": c.status.value,
        "investigator_id": c.investigator_id,
    } for c in recent_cases]

    audit_q = db.query(AuditLog)
    if user.role.value != "SUPER_ADMIN":
        audit_q = audit_q.filter(AuditLog.institution_id == user.institution_id)
    recent_activity = audit_q.order_by(AuditLog.created_at.desc()).limit(10).all()
    activity_out = [{
        "action": a.action,
        "resource_type": a.resource_type,
        "resource_id": a.resource_id,
        "timestamp": a.created_at.isoformat(),
    } for a in recent_activity]

    return {
        "stats": {
            "total_cases": total_cases,
            "open_cases": open_cases,
            "high_risk_cases": high_risk_cases,
            "investigations_completed": investigations_completed,
            "suspicious_wallets": suspicious_wallets,
            "exchanges_identified": exchanges_identified,
        },
        "risk_distribution": risk_distribution,
        "recent_cases": recent_cases_out,
        "recent_activity": activity_out,
    }
