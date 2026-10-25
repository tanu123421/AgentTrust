from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# ----------------- Tool Config & Policy -----------------
class ToolConfigItem(BaseModel):
    name: str = Field(..., description="Simulated tool name, e.g. read_document, send_email")
    permission: str = Field(..., description="allowed, approval_required, denied")
    description: str = Field("", description="Purpose of tool")

class ToolPolicySimulationRequest(BaseModel):
    agent_profile_id: Optional[str] = None
    tool_name: str
    requested_action: str
    input_payload: Optional[Dict[str, Any]] = None

class ToolPolicySimulationResponse(BaseModel):
    id: str
    tool_name: str
    requested_action: str
    decision: str  # ALLOWED, DENIED, REQUIRES_APPROVAL
    reason: str
    simulated_execution_output: Optional[str] = None
    created_at: datetime

# ----------------- Project Schemas -----------------
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    target_type: str = Field("Tool-Augmented Agent", max_length=100)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    target_type: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    profiles_count: int = 0
    runs_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# ----------------- Agent Profile Schemas -----------------
class AgentProfileBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    model_provider: str = Field("offline-synthetic", max_length=100)
    sensitivity_level: str = Field("Internal", max_length=50)
    system_prompt_marker: str = Field("CANARY_SYSTEM_PROMPT_SECRET_0912", max_length=100)
    tools_config: List[ToolConfigItem] = []
    evaluation_notes: Optional[str] = None

class AgentProfileCreate(AgentProfileBase):
    project_id: str

class AgentProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model_provider: Optional[str] = None
    sensitivity_level: Optional[str] = None
    system_prompt_marker: Optional[str] = None
    tools_config: Optional[List[ToolConfigItem]] = None
    evaluation_notes: Optional[str] = None

class AgentProfileResponse(AgentProfileBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Finding Schemas -----------------
class FindingResponse(BaseModel):
    id: str
    run_id: str
    test_id: str
    rule_id: str
    category: str
    title: str
    severity: str
    outcome: str
    evidence_masked: str
    explanation: str
    expected_behavior: str
    observed_behavior: str
    recommended_mitigation: str
    detection_method: str
    limitations_note: str
    status: str
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FindingUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|UNDER_REVIEW|ACCEPTED_RISK|MITIGATED)$")
    review_notes: str = Field(..., min_length=3, max_length=2000)

# ----------------- Test Execution Record -----------------
class TestExecutionRecordResponse(BaseModel):
    id: str
    run_id: str
    test_id: str
    rule_id: str
    category: str
    name: str
    is_benign_control: bool
    outcome: str
    severity: str
    input_scenario: str
    observed_response: Optional[str] = None
    explanation: Optional[str] = None
    execution_time_ms: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Evaluation Run Schemas -----------------
class EvaluationRunCreate(BaseModel):
    project_id: str
    agent_profile_id: str
    category_filter: Optional[List[str]] = None
    custom_prompt: Optional[str] = None
    simulated_agent_response: Optional[str] = None
    notes: Optional[str] = None

class EvaluationRunResponse(BaseModel):
    id: str
    project_id: str
    agent_profile_id: str
    suite_version: str
    engine_version: str
    status: str
    total_tests: int
    passed_count: int
    failed_count: int
    review_count: int
    error_count: int
    detection_rate: Optional[float] = None
    false_positive_rate: Optional[float] = None
    execution_duration_ms: float
    target_summary: Dict[str, Any] = {}
    notes: Optional[str] = None
    created_at: datetime
    completed_at: datetime
    agent_name: Optional[str] = None
    project_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EvaluationRunDetailResponse(EvaluationRunResponse):
    findings: List[FindingResponse] = []
    test_results: List[TestExecutionRecordResponse] = []

# ----------------- Run Comparison Schemas -----------------
class RunComparisonFinding(BaseModel):
    test_id: str
    title: str
    category: str
    severity: str
    outcome_run_a: Optional[str] = None
    outcome_run_b: Optional[str] = None
    status_change: str  # NEW_FAILURE, RESOLVED, PERSISTENT_FAILURE, SAME_PASS, INCONCLUSIVE

class EvaluationComparisonResponse(BaseModel):
    run_a: EvaluationRunResponse
    run_b: EvaluationRunResponse
    newly_introduced_failures: List[RunComparisonFinding] = []
    resolved_failures: List[RunComparisonFinding] = []
    persistent_failures: List[RunComparisonFinding] = []
    other_changes: List[RunComparisonFinding] = []
    summary: Dict[str, Any] = {}

# ----------------- Dashboard & Stats -----------------
class DashboardStatsResponse(BaseModel):
    total_runs: int
    total_tests_executed: int
    findings_by_severity: Dict[str, int]
    overall_pass_rate: float
    recent_runs: List[EvaluationRunResponse]
    category_summary: Dict[str, Dict[str, int]]
    latest_status_note: str

# ----------------- Environment / System -----------------
class EnvironmentStatusResponse(BaseModel):
    app_name: str
    version: str
    environment: str
    database_status: str
    active_test_definitions: int
    available_categories: List[str]
    llm_integration_status: str
    api_docs_url: str
