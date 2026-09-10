from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.audit import log_action
from app.models.models import (
    Case, Investigation, Evidence, User, CaseStatusEnum, RiskLevelEnum
)
from app.schemas.schemas import InvestigationOut, EvidenceOut, NotesUpdate
from app.auth.dependencies import get_current_user
from app.services.investigation_service import run_investigation

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


def _scoped_case(db: Session, user: User, case_id: str) -> Case:
    q = db.query(Case)
    if user.role.value != "SUPER_ADMIN":
        q = q.filter(Case.institution_id == user.institution_id)
    case = q.filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


def _scoped_investigation(db: Session, user: User, investigation_id: str) -> Investigation:
    q = db.query(Investigation)
    if user.role.value != "SUPER_ADMIN":
        q = q.filter(Investigation.institution_id == user.institution_id)
    inv = q.filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")
    return inv


class StartInvestigationRequest(BaseModel):
    case_id: str


@router.get("-list", response_model=list[InvestigationOut])
def list_investigations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Investigation)
    if user.role.value != "SUPER_ADMIN":
        q = q.filter(Investigation.institution_id == user.institution_id)
    items = q.order_by(Investigation.created_at.desc()).all()
    return [InvestigationOut.model_validate(i) for i in items]


@router.post("", response_model=InvestigationOut)
def start_investigation(
    payload: StartInvestigationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = _scoped_case(db, user, payload.case_id)

    start_address = case.wallet_address or case.transaction_hash
    if not start_address:
        raise HTTPException(status_code=422, detail="Case has no wallet address or transaction hash")

    result = run_investigation(start_address)

    investigation = Investigation(
        institution_id=case.institution_id,
        case_id=case.id,
        status="completed",
        executive_summary=result["executive_summary"],
        risk_score=result["risk_score"],
        risk_level=RiskLevelEnum(result["risk_level"]),
        risk_factors=result["risk_factors"],
        findings=result["findings"],
        probable_entity_name=result["probable_entity_name"],
        probable_entity_confidence=result["probable_entity_confidence"],
        probable_entity_reasoning=result["probable_entity_reasoning"],
        graph_data=result["graph"],
        timeline=result["timeline"],
    )
    db.add(investigation)
    db.flush()

    for ev in result["evidence_items"]:
        db.add(Evidence(
            institution_id=case.institution_id,
            investigation_id=investigation.id,
            evidence_code=ev["evidence_code"],
            evidence_type=ev["evidence_type"],
            transaction_hash=ev["transaction_hash"],
            source_wallet=ev["source_wallet"],
            destination_wallet=ev["destination_wallet"],
            amount=ev["amount"],
            token=ev["token"],
            timestamp=datetime.fromisoformat(ev["timestamp"]),
            blockchain=ev["blockchain"],
            finding_supported=ev["finding_supported"],
        ))

    case.risk_score = result["risk_score"]
    case.risk_level = RiskLevelEnum(result["risk_level"])
    case.status = CaseStatusEnum.HIGH_RISK if result["risk_score"] >= 50 else CaseStatusEnum.UNDER_INVESTIGATION

    db.commit()
    db.refresh(investigation)

    log_action(db, "Investigation started", institution_id=case.institution_id, user_id=user.id,
               resource_type="case", resource_id=case.id)
    log_action(db, "Investigation completed", institution_id=case.institution_id, user_id=user.id,
               resource_type="investigation", resource_id=investigation.id,
               details=f"risk={result['risk_score']}")

    return InvestigationOut.model_validate(investigation)


@router.get("/{investigation_id}", response_model=InvestigationOut)
def get_investigation(investigation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = _scoped_investigation(db, user, investigation_id)
    return InvestigationOut.model_validate(inv)


@router.get("/{investigation_id}/graph")
def get_graph(investigation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = _scoped_investigation(db, user, investigation_id)
    return inv.graph_data


@router.get("/{investigation_id}/transactions")
def get_transactions(investigation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = _scoped_investigation(db, user, investigation_id)
    return inv.graph_data.get("edges", [])


@router.get("/{investigation_id}/evidence", response_model=list[EvidenceOut])
def get_evidence(investigation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = _scoped_investigation(db, user, investigation_id)
    q = db.query(Evidence).filter(Evidence.investigation_id == inv.id)
    if user.role.value != "SUPER_ADMIN":
        q = q.filter(Evidence.institution_id == user.institution_id)
    items = q.all()
    log_action(db, "Evidence viewed", institution_id=user.institution_id, user_id=user.id,
               resource_type="investigation", resource_id=inv.id)
    return [EvidenceOut.model_validate(e) for e in items]


@router.get("/{investigation_id}/risk")
def get_risk(investigation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = _scoped_investigation(db, user, investigation_id)
    return {
        "score": inv.risk_score,
        "level": inv.risk_level.value,
        "factors": inv.risk_factors,
        "findings": inv.findings,
    }


@router.put("/{investigation_id}/notes", response_model=InvestigationOut)
def update_notes(
    investigation_id: str, payload: NotesUpdate,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    inv = _scoped_investigation(db, user, investigation_id)
    inv.investigator_notes = payload.investigator_notes
    db.commit()
    db.refresh(inv)
    return InvestigationOut.model_validate(inv)
