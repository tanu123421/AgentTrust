import time
from sqlalchemy.orm import Session
from app.models.models import Project, AgentProfile, EvaluationRun, Finding, TestExecutionRecord
from app.schemas.schemas import EvaluationRunCreate
from app.services.evaluation_service import EvaluationService
from app.evaluation.test_cases import TEST_CASES

def seed_database_if_empty(db: Session):
    """
    Populates database with a comprehensive initial demo project,
    sample agent profiles with distinct permission configs,
    and two evaluation runs so that run comparison, findings explorer,
    and dashboard metrics are immediately visible on first launch.
    """
    existing_project = db.query(Project).first()
    if existing_project:
        return  # Already seeded or has user data

    # 1. Create Demo Project
    demo_project = Project(
        name="Enterprise Support & Financial Assistant",
        description="Customer-facing enterprise AI agent with document search and customer record tools.",
        target_type="Tool-Augmented Agent"
    )
    db.add(demo_project)
    db.commit()
    db.refresh(demo_project)

    # 2. Create Agent Profiles
    # Profile A: Baseline (Vulnerable default settings)
    profile_a = AgentProfile(
        project_id=demo_project.id,
        name="SupportBot-v1.0 (Baseline)",
        description="Legacy agent configuration with broad permissions and standard system prompt.",
        model_provider="offline-synthetic-v1",
        sensitivity_level="Confidential",
        system_prompt_marker="CANARY_SYSTEM_PROMPT_SECRET_0912",
        tools_config=[
            {"name": "read_document", "permission": "allowed", "description": "Reads document records"},
            {"name": "search_records", "permission": "allowed", "description": "Queries customer records"},
            {"name": "send_email", "permission": "allowed", "description": "Outbound email without approval gate"},
            {"name": "delete_record", "permission": "denied", "description": "Blocked record deletion"}
        ],
        evaluation_notes="Baseline deployment before security hardening and approval gate enforcement."
    )
    db.add(profile_a)

    # Profile B: Hardened Agent (Hardened permissions & guardrails)
    profile_b = AgentProfile(
        project_id=demo_project.id,
        name="SupportBot-v1.1 (Hardened Candidate)",
        description="Hardened candidate with approval gates for email and explicit tool least privilege.",
        model_provider="offline-synthetic-v1",
        sensitivity_level="Confidential",
        system_prompt_marker="CANARY_SYSTEM_PROMPT_SECRET_0912",
        tools_config=[
            {"name": "read_document", "permission": "allowed", "description": "Reads document records"},
            {"name": "search_records", "permission": "allowed", "description": "Queries customer records"},
            {"name": "send_email", "permission": "approval_required", "description": "Requires supervisor sign-off"},
            {"name": "delete_record", "permission": "denied", "description": "Explicitly forbidden"}
        ],
        evaluation_notes="Remediated send_email permissions by enforcing approval_required policy gate."
    )
    db.add(profile_b)
    db.commit()
    db.refresh(profile_a)
    db.refresh(profile_b)

    # 3. Execute Baseline Evaluation Run for Profile A
    run_create_a = EvaluationRunCreate(
        project_id=demo_project.id,
        agent_profile_id=profile_a.id,
        notes="Automated baseline security evaluation for SupportBot v1.0."
    )
    EvaluationService.run_evaluation(db, run_create_a)

    # 4. Execute Evaluation Run for Profile B (Hardened)
    run_create_b = EvaluationRunCreate(
        project_id=demo_project.id,
        agent_profile_id=profile_b.id,
        notes="Regression evaluation following tool policy hardening on SupportBot v1.1."
    )
    EvaluationService.run_evaluation(db, run_create_b)

    print("[AgentTrust] Initial synthetic seed dataset initialized successfully.")
