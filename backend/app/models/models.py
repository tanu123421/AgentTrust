import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_type = Column(String(100), default="Tool-Augmented Agent") # e.g. "Chatbot Agent", "Tool-Augmented Agent", "RAG Pipeline", "Autonomous Worker"
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    agent_profiles = relationship("AgentProfile", back_populates="project", cascade="all, delete-orphan")
    evaluation_runs = relationship("EvaluationRun", back_populates="project", cascade="all, delete-orphan")

class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    model_provider = Column(String(100), default="offline-synthetic")
    sensitivity_level = Column(String(50), default="Internal") # Public, Internal, Confidential, Restricted
    system_prompt_marker = Column(String(100), default="CANARY_SYSTEM_PROMPT_SECRET_0912")
    tools_config = Column(JSON, default=list) # List of dicts: [{"name": "read_document", "permission": "allowed", "description": "..."}]
    evaluation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    project = relationship("Project", back_populates="agent_profiles")
    evaluation_runs = relationship("EvaluationRun", back_populates="agent_profile", cascade="all, delete-orphan")
    audit_logs = relationship("ToolPolicyAuditLog", back_populates="agent_profile", cascade="all, delete-orphan")

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    agent_profile_id = Column(String(36), ForeignKey("agent_profiles.id", ondelete="CASCADE"), nullable=False)
    
    suite_version = Column(String(50), default="1.0.0")
    engine_version = Column(String(50), default="1.0.0")
    status = Column(String(50), default="COMPLETED") # RUNNING, COMPLETED, FAILED
    
    total_tests = Column(Integer, default=0)
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    
    detection_rate = Column(Float, nullable=True) # Percentage on positive test cases
    false_positive_rate = Column(Float, nullable=True) # Percentage on benign controls
    execution_duration_ms = Column(Float, default=0.0)
    
    target_summary = Column(JSON, default=dict)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    completed_at = Column(DateTime, default=get_utc_now)

    # Relationships
    project = relationship("Project", back_populates="evaluation_runs")
    agent_profile = relationship("AgentProfile", back_populates="evaluation_runs")
    findings = relationship("Finding", back_populates="evaluation_run", cascade="all, delete-orphan")
    test_results = relationship("TestExecutionRecord", back_populates="evaluation_run", cascade="all, delete-orphan")

class TestExecutionRecord(Base):
    __tablename__ = "test_execution_records"
    __test__ = False


    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), nullable=False)
    test_id = Column(String(100), nullable=False)
    rule_id = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    name = Column(String(200), nullable=False)
    is_benign_control = Column(Boolean, default=False)
    
    outcome = Column(String(20), nullable=False) # PASS, FAIL, REVIEW, ERROR
    severity = Column(String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW, INFO
    input_scenario = Column(Text, nullable=False)
    observed_response = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)

    evaluation_run = relationship("EvaluationRun", back_populates="test_results")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), nullable=False)
    test_id = Column(String(100), nullable=False)
    rule_id = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    title = Column(String(250), nullable=False)
    severity = Column(String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW, INFO
    outcome = Column(String(20), nullable=False) # FAIL, REVIEW, ERROR
    
    evidence_masked = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=False)
    observed_behavior = Column(Text, nullable=False)
    recommended_mitigation = Column(Text, nullable=False)
    detection_method = Column(String(100), default="Deterministic Rule Matcher")
    limitations_note = Column(Text, nullable=False)
    
    status = Column(String(50), default="OPEN") # OPEN, UNDER_REVIEW, ACCEPTED_RISK, MITIGATED
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    evaluation_run = relationship("EvaluationRun", back_populates="findings")

class ToolPolicyAuditLog(Base):
    __tablename__ = "tool_policy_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_profile_id = Column(String(36), ForeignKey("agent_profiles.id", ondelete="SET NULL"), nullable=True)
    tool_name = Column(String(100), nullable=False)
    requested_action = Column(String(200), nullable=False)
    input_payload = Column(Text, nullable=True)
    decision = Column(String(50), nullable=False) # ALLOWED, DENIED, REQUIRES_APPROVAL
    reason = Column(Text, nullable=False)
    simulated_execution_output = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    agent_profile = relationship("AgentProfile", back_populates="audit_logs")
