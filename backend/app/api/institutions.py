from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Institution, User, RoleEnum
from app.schemas.schemas import InstitutionOut
from app.auth.dependencies import require_roles, get_current_user

router = APIRouter(prefix="/api/institutions", tags=["institutions"])


@router.get("", response_model=list[InstitutionOut])
def list_institutions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Super admin sees all; institution users see only their own (for display purposes).
    if user.role == RoleEnum.SUPER_ADMIN:
        items = db.query(Institution).all()
    else:
        items = db.query(Institution).filter(Institution.id == user.institution_id).all()
    return [InstitutionOut.model_validate(i) for i in items]
