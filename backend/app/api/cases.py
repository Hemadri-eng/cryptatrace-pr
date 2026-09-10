import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.audit import log_action
from app.models.models import Case, User, CaseStatusEnum, PriorityEnum, InputTypeEnum, RiskLevelEnum
from app.schemas.schemas import CaseCreate, CaseUpdate, CaseOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/cases", tags=["cases"])


def _scoped_query(db: Session, user: User):
    """Every case query MUST go through here so tenant isolation is
    enforced at the backend, never relying on frontend filtering."""
    q = db.query(Case)
    if user.role.value != "SUPER_ADMIN":
        q = q.filter(Case.institution_id == user.institution_id)
    return q


def _next_case_number(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(Case).count() + 1
    return f"ATH-{year}-{count:04d}"


@router.get("", response_model=list[CaseOut])
def list_cases(
    status_filter: str | None = None,
    risk_filter: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = _scoped_query(db, user)
    if status_filter:
        q = q.filter(Case.status == status_filter)
    if risk_filter:
        q = q.filter(Case.risk_level == risk_filter)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Case.case_number.ilike(like)) |
            (Case.wallet_address.ilike(like)) |
            (Case.transaction_hash.ilike(like)) |
            (Case.title.ilike(like))
        )
    cases = q.order_by(Case.created_at.desc()).all()
    return [CaseOut.model_validate(c) for c in cases]


@router.post("", response_model=CaseOut)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user.institution_id:
        raise HTTPException(status_code=400, detail="Super admin cannot create cases directly")
    if payload.input_type == "wallet" and not payload.wallet_address:
        raise HTTPException(status_code=422, detail="Wallet address is required")
    if payload.input_type == "transaction" and not payload.transaction_hash:
        raise HTTPException(status_code=422, detail="Transaction hash is required")

    case = Case(
        institution_id=user.institution_id,
        case_number=_next_case_number(db),
        title=payload.title,
        description=payload.description,
        incident_type=payload.incident_type,
        fraud_type=payload.fraud_type,
        input_type=InputTypeEnum(payload.input_type),
        wallet_address=payload.wallet_address,
        transaction_hash=payload.transaction_hash,
        network=payload.network,
        approx_amount=payload.approx_amount,
        currency=payload.currency,
        victim_notes=payload.victim_notes,
        priority=PriorityEnum(payload.priority),
        status=CaseStatusEnum.SUBMITTED if payload.submit_now else CaseStatusEnum.DRAFT,
        created_by=user.id,
        investigator_id=user.id,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    log_action(db, "Case created", institution_id=user.institution_id, user_id=user.id,
               resource_type="case", resource_id=case.id, details=case.case_number)

    return CaseOut.model_validate(case)


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    case = _scoped_query(db, user).filter(Case.id == case_id).first()
    if not case:
        # 404 regardless of whether the case exists in another institution -
        # never leak existence of another tenant's data.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return CaseOut.model_validate(case)


@router.put("/{case_id}", response_model=CaseOut)
def update_case(
    case_id: str, payload: CaseUpdate,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    case = _scoped_query(db, user).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    if payload.title is not None:
        case.title = payload.title
    if payload.description is not None:
        case.description = payload.description
    if payload.status is not None:
        case.status = CaseStatusEnum(payload.status)
    if payload.priority is not None:
        case.priority = PriorityEnum(payload.priority)
    if payload.investigator_id is not None:
        case.investigator_id = payload.investigator_id

    db.commit()
    db.refresh(case)
    log_action(db, "Case status changed", institution_id=user.institution_id, user_id=user.id,
               resource_type="case", resource_id=case.id)
    return CaseOut.model_validate(case)
