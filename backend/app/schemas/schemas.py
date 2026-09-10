from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ---------------- Auth ----------------
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    organization_name: str
    badge_id: str | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    full_name: str
    email: str
    role: str
    institution_id: str | None = None
    badge_id: str | None = None


class InstitutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    code: str
    institution_type: str
    is_active: bool


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    institution: InstitutionOut | None = None


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    badge_id: str | None = None


# ---------------- Cases ----------------
class CaseCreate(BaseModel):
    title: str
    description: str = ""
    incident_type: str = "Other"
    fraud_type: str = "Other"
    input_type: str = "wallet"  # wallet | transaction
    wallet_address: str | None = None
    transaction_hash: str | None = None
    network: str = "Ethereum"
    approx_amount: float | None = None
    currency: str = "ETH"
    victim_notes: str = ""
    priority: str = "Medium"
    submit_now: bool = False  # true = "Submit & Investigate", false = "Save Draft"


class CaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    investigator_id: str | None = None


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_number: str
    title: str
    description: str
    incident_type: str
    fraud_type: str
    input_type: str
    wallet_address: str | None
    transaction_hash: str | None
    network: str
    approx_amount: float | None
    currency: str
    priority: str
    status: str
    risk_score: float | None
    risk_level: str | None
    created_by: str
    investigator_id: str | None
    created_at: datetime
    updated_at: datetime


# ---------------- Investigation ----------------
class InvestigationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    status: str
    executive_summary: str
    risk_score: float
    risk_level: str
    risk_factors: list
    findings: list
    probable_entity_name: str | None
    probable_entity_confidence: float | None
    probable_entity_reasoning: str | None
    graph_data: dict
    timeline: list
    investigator_notes: str
    created_at: datetime


class NotesUpdate(BaseModel):
    investigator_notes: str


# ---------------- Evidence ----------------
class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    evidence_code: str
    evidence_type: str
    transaction_hash: str | None
    source_wallet: str | None
    destination_wallet: str | None
    amount: float | None
    token: str | None
    timestamp: datetime | None
    blockchain: str | None
    finding_supported: str | None


# ---------------- Reports ----------------
class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    investigation_id: str
    report_number: str
    html_content: str
    created_at: datetime
