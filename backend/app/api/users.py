from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.audit import log_action
from app.models.models import User, RoleEnum
from app.schemas.schemas import UserOut, UserCreate
from app.auth.dependencies import get_current_user, require_roles
from app.auth.security import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(User)
    if user.role.value != "SUPER_ADMIN":
        q = q.filter(User.institution_id == user.institution_id)
    return [UserOut.model_validate(u) for u in q.all()]


@router.post("", response_model=UserOut)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(RoleEnum.INSTITUTION_ADMIN, RoleEnum.SUPER_ADMIN)),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already in use")
    if payload.role == RoleEnum.SUPER_ADMIN.value and user.role != RoleEnum.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admins can create super admins")

    new_user = User(
        institution_id=user.institution_id if user.role != RoleEnum.SUPER_ADMIN else None,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=RoleEnum(payload.role),
        badge_id=payload.badge_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(db, "User created", institution_id=user.institution_id, user_id=user.id,
               resource_type="user", resource_id=new_user.id)

    return UserOut.model_validate(new_user)
