import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String, Integer, Float, ForeignKey, DateTime, Enum, Text, Boolean, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    INSTITUTION_ADMIN = "INSTITUTION_ADMIN"
    INVESTIGATOR = "INVESTIGATOR"


class CaseStatusEnum(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_INVESTIGATION = "Under Investigation"
    HIGH_RISK = "High Risk"
    RESOLVED = "Resolved"
    ARCHIVED = "Archived"


class RiskLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PriorityEnum(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"


class InputTypeEnum(str, enum.Enum):
    WALLET = "wallet"
    TRANSACTION = "transaction"


# --------------------------------------------------------------------------
# Institution (tenant root)
# --------------------------------------------------------------------------
class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    institution_type: Mapped[str] = mapped_column(String, default="Law Enforcement")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users: Mapped[list["User"]] = relationship(back_populates="institution")
    cases: Mapped[list["Case"]] = relationship(back_populates="institution")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    institution_id: Mapped[str | None] = mapped_column(
        ForeignKey("institutions.id"), nullable=True  # null only for SUPER_ADMIN
    )
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), nullable=False)
    badge_id: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    institution: Mapped["Institution"] = relationship(back_populates="users")


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), nullable=False, index=True)
    case_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    incident_type: Mapped[str] = mapped_column(String, default="Other")
    fraud_type: Mapped[str] = mapped_column(String, default="Other")
    input_type: Mapped[InputTypeEnum] = mapped_column(Enum(InputTypeEnum), default=InputTypeEnum.WALLET)
    wallet_address: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    transaction_hash: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    network: Mapped[str] = mapped_column(String, default="Ethereum")
    approx_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="ETH")
    victim_notes: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[PriorityEnum] = mapped_column(Enum(PriorityEnum), default=PriorityEnum.MEDIUM)
    status: Mapped[CaseStatusEnum] = mapped_column(Enum(CaseStatusEnum), default=CaseStatusEnum.DRAFT)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[RiskLevelEnum | None] = mapped_column(Enum(RiskLevelEnum), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    investigator_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    institution: Mapped["Institution"] = relationship(back_populates="cases")
    investigations: Mapped[list["Investigation"]] = relationship(back_populates="case", cascade="all, delete-orphan")


class Investigation(Base):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), nullable=False, index=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, default="completed")
    executive_summary: Mapped[str] = mapped_column(Text, default="")
    risk_score: Mapped[float] = mapped_column(Float, default=0)
    risk_level: Mapped[RiskLevelEnum] = mapped_column(Enum(RiskLevelEnum), default=RiskLevelEnum.LOW)
    risk_factors: Mapped[dict] = mapped_column(JSON, default=list)  # list of {label, weight, detail}
    findings: Mapped[dict] = mapped_column(JSON, default=list)  # behavioural findings
    probable_entity_name: Mapped[str | None] = mapped_column(String, nullable=True)
    probable_entity_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    probable_entity_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    graph_data: Mapped[dict] = mapped_column(JSON, default=dict)  # {nodes:[], edges:[]}
    timeline: Mapped[dict] = mapped_column(JSON, default=list)
    investigator_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    case: Mapped["Case"] = relationship(back_populates="investigations")
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="investigation", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="investigation", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), nullable=False, index=True)
    investigation_id: Mapped[str] = mapped_column(ForeignKey("investigations.id"), nullable=False, index=True)
    evidence_code: Mapped[str] = mapped_column(String, nullable=False)
    evidence_type: Mapped[str] = mapped_column(String, default="transaction")
    transaction_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    source_wallet: Mapped[str | None] = mapped_column(String, nullable=True)
    destination_wallet: Mapped[str | None] = mapped_column(String, nullable=True)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    token: Mapped[str | None] = mapped_column(String, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    blockchain: Mapped[str | None] = mapped_column(String, nullable=True)
    finding_supported: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    investigation: Mapped["Investigation"] = relationship(back_populates="evidence")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), nullable=False, index=True)
    investigation_id: Mapped[str] = mapped_column(ForeignKey("investigations.id"), nullable=False, index=True)
    report_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    generated_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    html_content: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    investigation: Mapped["Investigation"] = relationship(back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    institution_id: Mapped[str | None] = mapped_column(ForeignKey("institutions.id"), nullable=True, index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String, nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
