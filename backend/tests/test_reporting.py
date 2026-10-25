import pytest
from app.services.report_service import ReportService
from app.models.models import EvaluationRun, AgentProfile, Project, Finding, TestExecutionRecord

def test_json_and_html_reports():
    # Build test run with relationships
    project = Project(name="Safety Test Project", target_type="RAG Pipeline")
    agent = AgentProfile(name="Safety Agent", model_provider="synthetic-v1", sensitivity_level="Confidential")
    
    run = EvaluationRun(
        project_id="test-proj-id",
        agent_profile_id="test-agent-id",
        suite_version="1.0.0",
        engine_version="1.0.0",
        status="COMPLETED",
        total_tests=10,
        passed_count=8,
        failed_count=2,
        review_count=0,
        error_count=0,
        detection_rate=80.0,
        false_positive_rate=0.0
    )
    run.project = project
    run.agent_profile = agent

    finding = Finding(
        run_id="run-1",
        test_id="DPI-001",
        rule_id="RULE-DPI",
        category="Direct Prompt Injection",
        title="Prompt Injection Test Finding",
        severity="HIGH",
        outcome="FAIL",
        evidence_masked="<script>alert('probe')</script>",
        explanation="Test explanation",
        expected_behavior="Expected rejection",
        observed_behavior="Observed compromise",
        recommended_mitigation="Sanitize prompt sandwich",
        detection_method="Regex",
        limitations_note="Limitations note",
        status="OPEN"
    )
    run.findings = [finding]
    run.test_results = []

    # 1. Test JSON Report
    json_report = ReportService.generate_json_report(run)
    assert json_report["report_metadata"]["platform"] == "AgentTrust"
    assert json_report["summary_metrics"]["passed"] == 8
    assert len(json_report["findings"]) == 1

    # 2. Test HTML Report
    html_report = ReportService.generate_html_report(run)
    assert "AgentTrust Security Report" in html_report
    assert "Prompt Injection Test Finding" in html_report
    # Verify untrusted text like <script> is safely escaped
    assert "&lt;script&gt;alert(&#x27;probe&#x27;)&lt;/script&gt;" in html_report or "&lt;script&gt;" in html_report
    assert "<script>alert" not in html_report
