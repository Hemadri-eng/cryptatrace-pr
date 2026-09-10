from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Evidence, User
from app.schemas.schemas import EvidenceOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/evidence", tags=["evidence"])


@router.get("", response_model=list[EvidenceOut])
def list_all_evidence(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Evidence)
    if user.role.value != "SUPER_ADMIN":
        q = q.filter(Evidence.institution_id == user.institution_id)
    items = q.order_by(Evidence.created_at.desc()).all()
    return [EvidenceOut.model_validate(e) for e in items]
