from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.audit import log_action
from app.models.models import User, Institution
from app.schemas.schemas import LoginRequest, LoginResponse, UserOut, InstitutionOut
from app.auth.security import verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
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
