from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.config import settings
from app.schemas.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    AgentProfileCreate, AgentProfileUpdate, AgentProfileResponse,
    EvaluationRunCreate, EvaluationRunResponse, EvaluationRunDetailResponse,
    EvaluationComparisonResponse,
    FindingResponse, FindingUpdate,
    ToolPolicySimulationRequest, ToolPolicySimulationResponse,
    DashboardStatsResponse, EnvironmentStatusResponse
)
from app.services.project_service import ProjectService
from app.services.evaluation_service import EvaluationService
from app.services.report_service import ReportService
from app.security.policy_engine import ToolPolicyEngine, TOOL_CATALOG
from app.models.models import ToolPolicyAuditLog, EvaluationRun
from app.evaluation.test_cases import TEST_CASES, CATEGORIES

router = APIRouter()

# ----------------- System & Health -----------------
@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@router.get("/status", response_model=EnvironmentStatusResponse, tags=["System"])
def system_status(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(EvaluationRun.__table__.select().limit(1))
    except Exception:
        db_ok = False

    return EnvironmentStatusResponse(
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database_status="Healthy (SQLite local persistence)" if db_ok else "Degraded",
        active_test_definitions=len(TEST_CASES),
        available_categories=CATEGORIES,
        llm_integration_status=f"Local-First ({settings.LLM_PROVIDER} mode, no external keys required)",
        api_docs_url="/docs"
    )

@router.get("/dashboard/stats", response_model=DashboardStatsResponse, tags=["Dashboard"])
def get_dashboard_statistics(db: Session = Depends(get_db)):
    return EvaluationService.get_dashboard_stats(db)

# ----------------- Projects -----------------
@router.get("/projects", response_model=List[ProjectResponse], tags=["Projects"])
def list_projects(db: Session = Depends(get_db)):
    projects = ProjectService.get_projects(db)
    res = []
    for p in projects:
        item = ProjectResponse.model_validate(p)
        item.profiles_count = len(p.agent_profiles)
        item.runs_count = len(p.evaluation_runs)
        res.append(item)
    return res

@router.post("/projects", response_model=ProjectResponse, status_code=201, tags=["Projects"])
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    p = ProjectService.create_project(db, project_in)
    item = ProjectResponse.model_validate(p)
    item.profiles_count = 0
    item.runs_count = 0
    return item

@router.get("/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def get_project(project_id: str, db: Session = Depends(get_db)):
    p = ProjectService.get_project_by_id(db, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
    item = ProjectResponse.model_validate(p)
    item.profiles_count = len(p.agent_profiles)
    item.runs_count = len(p.evaluation_runs)
    return item

@router.put("/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def update_project(project_id: str, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    p = ProjectService.update_project(db, project_id, project_in)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found.")
    item = ProjectResponse.model_validate(p)
    item.profiles_count = len(p.agent_profiles)
    item.runs_count = len(p.evaluation_runs)
    return item

@router.delete("/projects/{project_id}", status_code=204, tags=["Projects"])
def delete_project(project_id: str, db: Session = Depends(get_db)):
    success = ProjectService.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found.")
    return Response(status_code=204)

# ----------------- Agent Profiles -----------------
@router.get("/projects/{project_id}/profiles", response_model=List[AgentProfileResponse], tags=["Agent Profiles"])
def list_project_profiles(project_id: str, db: Session = Depends(get_db)):
    return ProjectService.get_profiles_by_project(db, project_id)

@router.post("/projects/{project_id}/profiles", response_model=AgentProfileResponse, status_code=201, tags=["Agent Profiles"])
def create_agent_profile(project_id: str, profile_in: AgentProfileCreate, db: Session = Depends(get_db)):
    if profile_in.project_id != project_id:
        profile_in.project_id = project_id
    return ProjectService.create_agent_profile(db, profile_in)

@router.get("/profiles/{profile_id}", response_model=AgentProfileResponse, tags=["Agent Profiles"])
def get_agent_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = ProjectService.get_profile_by_id(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Agent profile not found.")
    return profile

@router.put("/profiles/{profile_id}", response_model=AgentProfileResponse, tags=["Agent Profiles"])
def update_agent_profile(profile_id: str, profile_in: AgentProfileUpdate, db: Session = Depends(get_db)):
    profile = ProjectService.update_agent_profile(db, profile_id, profile_in)
    if not profile:
        raise HTTPException(status_code=404, detail="Agent profile not found.")
    return profile

@router.delete("/profiles/{profile_id}", status_code=204, tags=["Agent Profiles"])
def delete_agent_profile(profile_id: str, db: Session = Depends(get_db)):
    success = ProjectService.delete_agent_profile(db, profile_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent profile not found.")
    return Response(status_code=204)

# ----------------- Test Catalog -----------------
@router.get("/test-cases", tags=["Security Lab"])
def get_test_cases():
    return {
        "categories": CATEGORIES,
        "total_test_cases": len(TEST_CASES),
        "test_cases": TEST_CASES
    }

# ----------------- Evaluations -----------------
@router.post("/evaluations/run", response_model=EvaluationRunResponse, status_code=201, tags=["Security Lab"])
def run_evaluation(run_in: EvaluationRunCreate, db: Session = Depends(get_db)):
    # Verify input bounds
    if run_in.custom_prompt and len(run_in.custom_prompt) > settings.MAX_INPUT_LENGTH_CHARS:
        raise HTTPException(status_code=413, detail=f"Custom prompt exceeds maximum allowed size of {settings.MAX_INPUT_LENGTH_CHARS} characters.")

    try:
        run = EvaluationService.run_evaluation(db, run_in)
        item = EvaluationRunResponse.model_validate(run)
        if run.agent_profile:
            item.agent_name = run.agent_profile.name
        if run.project:
            item.project_name = run.project.name
        return item
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Evaluation execution error: {str(ex)}")

@router.get("/evaluations/runs", response_model=List[EvaluationRunResponse], tags=["Evaluations"])
def list_evaluation_runs(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    runs = EvaluationService.get_runs(db, project_id)
    res = []
    for r in runs:
        item = EvaluationRunResponse.model_validate(r)
        if r.agent_profile:
            item.agent_name = r.agent_profile.name
        if r.project:
            item.project_name = r.project.name
        res.append(item)
    return res

@router.get("/evaluations/runs/{run_id}", response_model=EvaluationRunDetailResponse, tags=["Evaluations"])
def get_evaluation_run_detail(run_id: str, db: Session = Depends(get_db)):
    run = EvaluationService.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found.")
    
    item = EvaluationRunDetailResponse.model_validate(run)
    if run.agent_profile:
        item.agent_name = run.agent_profile.name
    if run.project:
        item.project_name = run.project.name
    return item

@router.get("/evaluations/compare", response_model=EvaluationComparisonResponse, tags=["Evaluations"])
def compare_runs(run_a: str = Query(...), run_b: str = Query(...), db: Session = Depends(get_db)):
    try:
        diff_data = EvaluationService.compare_runs(db, run_a, run_b)
        res = EvaluationComparisonResponse(
            run_a=EvaluationRunResponse.model_validate(diff_data["run_a"]),
            run_b=EvaluationRunResponse.model_validate(diff_data["run_b"]),
            newly_introduced_failures=diff_data["newly_introduced_failures"],
            resolved_failures=diff_data["resolved_failures"],
            persistent_failures=diff_data["persistent_failures"],
            other_changes=diff_data["other_changes"],
            summary=diff_data["summary"]
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

# ----------------- Reports -----------------
@router.get("/evaluations/runs/{run_id}/report/json", tags=["Reports"])
def export_json_report(run_id: str, db: Session = Depends(get_db)):
    run = EvaluationService.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found.")
    return ReportService.generate_json_report(run)

@router.get("/evaluations/runs/{run_id}/report/html", response_class=HTMLResponse, tags=["Reports"])
def export_html_report(run_id: str, db: Session = Depends(get_db)):
    run = EvaluationService.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found.")
    html_content = ReportService.generate_html_report(run)
    return HTMLResponse(content=html_content)

# ----------------- Findings Explorer -----------------
@router.get("/findings", response_model=List[FindingResponse], tags=["Findings"])
def query_findings(
    run_id: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return EvaluationService.get_findings(db, run_id, severity, category, status, search)

@router.patch("/findings/{finding_id}", response_model=FindingResponse, tags=["Findings"])
def update_finding_review(finding_id: str, update_in: FindingUpdate, db: Session = Depends(get_db)):
    finding = EvaluationService.update_finding_status(db, finding_id, update_in)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")
    return finding

# ----------------- Tool Permission Simulator -----------------
@router.get("/tools/catalog", tags=["Tool Simulator"])
def get_tool_catalog():
    return TOOL_CATALOG

@router.post("/tools/simulate", response_model=ToolPolicySimulationResponse, tags=["Tool Simulator"])
def simulate_tool_execution(req: ToolPolicySimulationRequest, db: Session = Depends(get_db)):
    configured_tools = None
    if req.agent_profile_id:
        profile = ProjectService.get_profile_by_id(db, req.agent_profile_id)
        if profile:
            configured_tools = profile.tools_config

    decision, reason, sim_output = ToolPolicyEngine.evaluate_tool_request(
        tool_name=req.tool_name,
        requested_action=req.requested_action,
        input_payload=req.input_payload or {},
        configured_tools=configured_tools
    )

    # Persist audit record
    audit_log = ToolPolicyAuditLog(
        agent_profile_id=req.agent_profile_id,
        tool_name=req.tool_name,
        requested_action=req.requested_action,
        input_payload=str(req.input_payload) if req.input_payload else None,
        decision=decision,
        reason=reason,
        simulated_execution_output=sim_output
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return ToolPolicySimulationResponse(
        id=audit_log.id,
        tool_name=audit_log.tool_name,
        requested_action=audit_log.requested_action,
        decision=audit_log.decision,
        reason=audit_log.reason,
        simulated_execution_output=audit_log.simulated_execution_output,
        created_at=audit_log.created_at
    )

@router.get("/tools/audit-logs", tags=["Tool Simulator"])
def list_tool_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(ToolPolicyAuditLog).order_by(ToolPolicyAuditLog.created_at.desc()).limit(limit).all()
    return logs
