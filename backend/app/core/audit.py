from sqlalchemy.orm import Session
from app.models.models import AuditLog


def log_action(
    db: Session,
    action: str,
    institution_id: str | None = None,
    user_id: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: str | None = None,
):
    entry = AuditLog(
        institution_id=institution_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
    )
    db.add(entry)
    db.commit()
