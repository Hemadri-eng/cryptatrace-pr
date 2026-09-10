"""
ATHENS demo data seeder.
Creates two demo institutions (for tenant-isolation demonstration),
demo users, and a couple of demo cases - including a pre-run
CRITICAL-risk investigation so the core journey is visible immediately.

Called automatically on backend startup (see app/main.py) so a fresh
deployment with an empty database self-seeds without needing shell
access. Safe to call repeatedly - it no-ops if data already exists.
"""
from datetime import datetime
from app.core.database import Base, engine, SessionLocal
from app.models import models
from app.models.models import (
    Institution, User, Case, RoleEnum, CaseStatusEnum, PriorityEnum,
    InputTypeEnum, RiskLevelEnum, Investigation, Evidence,
)
from app.auth.security import hash_password
from app.services.investigation_service import run_investigation

DEMO_PASSWORD = "Athens@2026"


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Institution).count() > 0:
            print("Demo data already exists. Skipping seed. (Delete athens.db to reseed.)")
            return

        # ---- Institutions ----
        inst_a = Institution(name="Athens Cyber Crime Unit", code="ACCU", institution_type="Law Enforcement")
        inst_b = Institution(name="Demo Financial Intelligence Unit", code="DFIU", institution_type="Financial Intelligence Unit")
        db.add_all([inst_a, inst_b])
        db.flush()

        # ---- Super admin (no institution) ----
        super_admin = User(
            institution_id=None, full_name="System Administrator",
            email="superadmin@athens.demo", hashed_password=hash_password(DEMO_PASSWORD),
            role=RoleEnum.SUPER_ADMIN, badge_id="SYS-000",
        )

        # ---- Institution A users ----
        admin_a = User(
            institution_id=inst_a.id, full_name="Ananya Rao", email="admin@athens.demo",
            hashed_password=hash_password(DEMO_PASSWORD), role=RoleEnum.INSTITUTION_ADMIN, badge_id="ACCU-001",
        )
        investigator_a = User(
            institution_id=inst_a.id, full_name="Rohan Verma", email="investigator@athens.demo",
            hashed_password=hash_password(DEMO_PASSWORD), role=RoleEnum.INVESTIGATOR, badge_id="ACCU-014",
        )

        # ---- Institution B users ----
        admin_b = User(
            institution_id=inst_b.id, full_name="Priya Nair", email="admin@dfiu.demo",
            hashed_password=hash_password(DEMO_PASSWORD), role=RoleEnum.INSTITUTION_ADMIN, badge_id="DFIU-001",
        )
        investigator_b = User(
            institution_id=inst_b.id, full_name="Karan Mehta", email="investigator@dfiu.demo",
            hashed_password=hash_password(DEMO_PASSWORD), role=RoleEnum.INVESTIGATOR, badge_id="DFIU-009",
        )

        db.add_all([super_admin, admin_a, investigator_a, admin_b, investigator_b])
        db.flush()

        # ---- Demo cases for Institution A ----
        demo_wallet_1 = "0xVICTIM00000000000000000000000000000001"
        case_a1 = Case(
            institution_id=inst_a.id,
            case_number="ATH-2026-0001",
            title="Investment scam - fraudulent trading platform",
            description="Victim was persuaded to deposit funds into a fake crypto trading platform promising guaranteed returns.",
            incident_type="Cyber Financial Fraud",
            fraud_type="Investment Scam",
            input_type=InputTypeEnum.WALLET,
            wallet_address=demo_wallet_1,
            network="Ethereum",
            approx_amount=2.5,
            currency="ETH",
            victim_notes="Victim contacted via social media investment group, transferred funds after being shown a fake dashboard.",
            priority=PriorityEnum.URGENT,
            status=CaseStatusEnum.SUBMITTED,
            created_by=investigator_a.id,
            investigator_id=investigator_a.id,
        )

        demo_wallet_2 = "0xVICTIM00000000000000000000000000000002"
        case_a2 = Case(
            institution_id=inst_a.id,
            case_number="ATH-2026-0002",
            title="Romance scam - crypto 'investment advice' from online partner",
            description="Victim met suspect on a dating app; suspect convinced victim to invest in crypto via a wallet they controlled.",
            incident_type="Cyber Financial Fraud",
            fraud_type="Romance Scam",
            input_type=InputTypeEnum.WALLET,
            wallet_address=demo_wallet_2,
            network="Ethereum",
            approx_amount=1.1,
            currency="ETH",
            victim_notes="Victim has chat logs; suspect has since gone unreachable.",
            priority=PriorityEnum.HIGH,
            status=CaseStatusEnum.DRAFT,
            created_by=investigator_a.id,
            investigator_id=investigator_a.id,
        )

        # ---- Demo case for Institution B (used to prove isolation) ----
        demo_wallet_3 = "0xVICTIM00000000000000000000000000000003"
        case_b1 = Case(
            institution_id=inst_b.id,
            case_number="ATH-2026-0003",
            title="Fake exchange - withdrawal blocked after deposit",
            description="Victim deposited funds to what appeared to be a legitimate exchange, then could not withdraw.",
            incident_type="Cyber Financial Fraud",
            fraud_type="Fake Exchange",
            input_type=InputTypeEnum.WALLET,
            wallet_address=demo_wallet_3,
            network="BSC",
            approx_amount=0.8,
            currency="BNB",
            victim_notes="Victim has deposit confirmation email and screenshots of the fake platform.",
            priority=PriorityEnum.MEDIUM,
            status=CaseStatusEnum.SUBMITTED,
            created_by=investigator_b.id,
            investigator_id=investigator_b.id,
        )

        db.add_all([case_a1, case_a2, case_b1])
        db.flush()

        # ---- Pre-run investigation for case_a1 so the demo shows a CRITICAL result immediately ----
        result = run_investigation(demo_wallet_1)
        investigation = Investigation(
            institution_id=inst_a.id,
            case_id=case_a1.id,
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
            investigator_notes="Initial triage complete. Escalating to senior investigator for exchange liaison.",
        )
        db.add(investigation)
        db.flush()

        for ev in result["evidence_items"]:
            db.add(Evidence(
                institution_id=inst_a.id,
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

        case_a1.risk_score = result["risk_score"]
        case_a1.risk_level = RiskLevelEnum(result["risk_level"])
        case_a1.status = CaseStatusEnum.HIGH_RISK

        db.commit()
        print("Seed complete.")
        print(f"Demo password for all accounts: {DEMO_PASSWORD}")
        print("Accounts:")
        print("  superadmin@athens.demo  (SUPER_ADMIN)")
        print("  admin@athens.demo       (INSTITUTION_ADMIN - Athens Cyber Crime Unit)")
        print("  investigator@athens.demo(INVESTIGATOR - Athens Cyber Crime Unit)")
        print("  admin@dfiu.demo         (INSTITUTION_ADMIN - Demo Financial Intelligence Unit)")
        print("  investigator@dfiu.demo  (INVESTIGATOR - Demo Financial Intelligence Unit)")
    finally:
        db.close()
