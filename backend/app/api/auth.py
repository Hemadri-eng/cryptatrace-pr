from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import re
import uuid

from app.core.database import get_db
from app.core.audit import log_action
from app.models.models import User, Institution, RoleEnum
from app.schemas.schemas import LoginRequest, RegisterRequest, LoginResponse, UserOut, InstitutionOut
from app.auth.security import verify_password, hash_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _generate_institution_code(name: str, db: Session) -> str:
    """Derives a short unique code from the organization name, e.g.
    'Metro Cyber Cell' -> 'MCC-A1B2'. Institution.code has a unique
    constraint, so we retry with a fresh suffix on the rare collision."""
    letters = re.sub(r"[^A-Za-z]", "", name).upper()
    prefix = (letters[:3] or "ORG")
    for _ in range(5):
        candidate = f"{prefix}-{uuid.uuid4().hex[:4].upper()}"
        if not db.query(Institution).filter(Institution.code == candidate).first():
            return candidate
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


@router.post("/register", response_model=LoginResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Public self-registration. Creates a brand-new institution (tenant)
    for the registering organization and makes the registrant its
    INSTITUTION_ADMIN, so tenant isolation guarantees are unaffected -
    every self-registered user still only ever sees their own
    institution's cases, exactly like an institution set up manually."""
    email = payload.email.strip().lower()
    if not payload.full_name.strip() or not payload.organization_name.strip():
        raise HTTPException(status_code=422, detail="Full name and organization name are required")
    if len(payload.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    institution = Institution(
        name=payload.organization_name.strip(),
        code=_generate_institution_code(payload.organization_name, db),
        institution_type="Law Enforcement",
    )
    db.add(institution)
    db.flush()

    user = User(
        institution_id=institution.id,
        full_name=payload.full_name.strip(),
        email=email,
        hashed_password=hash_password(payload.password),
        role=RoleEnum.INSTITUTION_ADMIN,
        badge_id=payload.badge_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(institution)

    token = create_access_token({
        "sub": user.id,
        "institution_id": user.institution_id,
        "role": user.role.value,
    })

    log_action(db, "Institution registered", institution_id=institution.id, user_id=user.id,
               resource_type="institution", resource_id=institution.id, details=institution.code)
    log_action(db, "User logged in", institution_id=institution.id, user_id=user.id,
               resource_type="auth", resource_id=user.id)

    return LoginResponse(
        access_token=token,
        user=UserOut.model_validate(user),
        institution=InstitutionOut.model_validate(institution),
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_access_token({
        "sub": user.id,
        "institution_id": user.institution_id,
        "role": user.role.value,
    })
    institution = None
    if user.institution_id:
        institution = db.query(Institution).filter(Institution.id == user.institution_id).first()

    log_action(db, "User logged in", institution_id=user.institution_id, user_id=user.id,
               resource_type="auth", resource_id=user.id)

    return LoginResponse(
        access_token=token,
        user=UserOut.model_validate(user),
        institution=InstitutionOut.model_validate(institution) if institution else None,
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/logout")
def logout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Stateless JWT: logout is handled client-side by discarding the token.
    log_action(db, "User logged out", institution_id=current_user.institution_id,
               user_id=current_user.id, resource_type="auth", resource_id=current_user.id)
    return {"detail": "Logged out"}
