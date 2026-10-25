import time
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import EvaluationRun, Finding, TestExecutionRecord, AgentProfile, Project, ToolPolicyAuditLog
from app.schemas.schemas import EvaluationRunCreate, FindingUpdate
from app.evaluation.engine import EvaluationEngine
from app.evaluation.test_cases import TEST_CASES

class EvaluationService:
    @staticmethod
    def run_evaluation(db: Session, run_in: EvaluationRunCreate) -> EvaluationRun:
        start_time = time.time()
        agent_profile = db.query(AgentProfile).filter(AgentProfile.id == run_in.agent_profile_id).first()
        if not agent_profile:
            raise ValueError(f"Agent profile '{run_in.agent_profile_id}' not found.")

        # Filter test cases if category_filter supplied
        catalog = TEST_CASES
        if run_in.category_filter:
            catalog = [t for t in catalog if t["category"] in run_in.category_filter]

        if not catalog:
            catalog = TEST_CASES

        # Initialize EvaluationRun model
        eval_run = EvaluationRun(
            project_id=run_in.project_id,
            agent_profile_id=run_in.agent_profile_id,
            suite_version="1.0.0",
            engine_version="1.0.0",
            status="RUNNING",
            total_tests=len(catalog),
            notes=run_in.notes
        )
        db.add(eval_run)
        db.commit()
        db.refresh(eval_run)

        passed_count = 0
        failed_count = 0
        review_count = 0
        error_count = 0

        positive_count = 0
        detected_positive = 0

        benign_count = 0
        flagged_benign = 0

        # Execute each test case
        for test_case in catalog:
            test_start = time.time()
            outcome, finding_dict, observed_resp, explanation = EvaluationEngine.evaluate_test_case(
                test_case=test_case,
                agent_profile=agent_profile,
                custom_response=run_in.simulated_agent_response if run_in.custom_prompt else None
            )
            test_duration_ms = round((time.time() - test_start) * 1000, 2)

            is_benign = test_case.get("is_benign_control", False)
            if is_benign:
                benign_count += 1
                if outcome in ["FAIL", "REVIEW"]:
                    flagged_benign += 1
            else:
                positive_count += 1
                if outcome in ["FAIL", "REVIEW"]:
                    detected_positive += 1

            if outcome == "PASS":
                passed_count += 1
            elif outcome == "FAIL":
                failed_count += 1
            elif outcome == "REVIEW":
                review_count += 1
            else:
                error_count += 1

            # Save execution record
            exec_record = TestExecutionRecord(
                run_id=eval_run.id,
                test_id=test_case["test_id"],
                rule_id=test_case["rule_id"],
                category=test_case["category"],
                name=test_case["name"],
                is_benign_control=is_benign,
                outcome=outcome,
                severity=test_case["severity"],
                input_scenario=test_case["input_scenario"][:2000],
                observed_response=observed_resp[:2000] if observed_resp else None,
                explanation=explanation,
                execution_time_ms=test_duration_ms
            )
            db.add(exec_record)

            # Save finding if applicable
            if finding_dict:
                finding = Finding(
                    run_id=eval_run.id,
                    test_id=finding_dict["test_id"],
                    rule_id=finding_dict["rule_id"],
                    category=finding_dict["category"],
                    title=finding_dict["title"],
                    severity=finding_dict["severity"],
                    outcome=finding_dict["outcome"],
                    evidence_masked=finding_dict["evidence_masked"],
                    explanation=finding_dict["explanation"],
                    expected_behavior=finding_dict["expected_behavior"],
                    observed_behavior=finding_dict["observed_behavior"],
                    recommended_mitigation=finding_dict["recommended_mitigation"],
                    detection_method=finding_dict["detection_method"],
                    limitations_note=finding_dict["limitations_note"],
                    status="OPEN"
                )
                db.add(finding)

        # Calculate metrics
        duration_total_ms = round((time.time() - start_time) * 1000, 2)
        detection_rate = round((detected_positive / positive_count) * 100, 1) if positive_count > 0 else None
        false_positive_rate = round((flagged_benign / benign_count) * 100, 1) if benign_count > 0 else None

        eval_run.status = "COMPLETED"
        eval_run.passed_count = passed_count
        eval_run.failed_count = failed_count
        eval_run.review_count = review_count
        eval_run.error_count = error_count
        eval_run.detection_rate = detection_rate
        eval_run.false_positive_rate = false_positive_rate
        eval_run.execution_duration_ms = duration_total_ms
        eval_run.completed_at = datetime.now(timezone.utc)
        eval_run.target_summary = {
            "agent_name": agent_profile.name,
            "provider": agent_profile.model_provider,
            "sensitivity": agent_profile.sensitivity_level,
            "tools_count": len(agent_profile.tools_config or [])
        }

        db.commit()
        db.refresh(eval_run)
        return eval_run

    @staticmethod
    def get_runs(db: Session, project_id: Optional[str] = None) -> List[EvaluationRun]:
        query = db.query(EvaluationRun)
        if project_id:
            query = query.filter(EvaluationRun.project_id == project_id)
        return query.order_by(EvaluationRun.created_at.desc()).all()

    @staticmethod
    def get_run_by_id(db: Session, run_id: str) -> Optional[EvaluationRun]:
        return db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()

    @staticmethod
    def get_findings(
        db: Session,
        run_id: Optional[str] = None,
        severity: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Finding]:
        query = db.query(Finding)
        if run_id:
            query = query.filter(Finding.run_id == run_id)
        if severity:
            query = query.filter(Finding.severity == severity.upper())
        if category:
            query = query.filter(Finding.category == category)
        if status:
            query = query.filter(Finding.status == status.upper())
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                (Finding.title.ilike(search_fmt)) |
                (Finding.rule_id.ilike(search_fmt)) |
                (Finding.test_id.ilike(search_fmt))
            )
        return query.order_by(Finding.created_at.desc()).all()

    @staticmethod
    def update_finding_status(db: Session, finding_id: str, update_in: FindingUpdate) -> Optional[Finding]:
        finding = db.query(Finding).filter(Finding.id == finding_id).first()
        if not finding:
            return None
        finding.status = update_in.status.upper()
        finding.review_notes = update_in.review_notes
        finding.reviewed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(finding)
        return finding

    @staticmethod
    def compare_runs(db: Session, run_a_id: str, run_b_id: str) -> Dict[str, Any]:
        run_a = db.query(EvaluationRun).filter(EvaluationRun.id == run_a_id).first()
        run_b = db.query(EvaluationRun).filter(EvaluationRun.id == run_b_id).first()

        if not run_a or not run_b:
            raise ValueError("One or both comparison runs could not be found.")

        # Map results by test_id
        results_a = {r.test_id: r for r in run_a.test_results}
        results_b = {r.test_id: r for r in run_b.test_results}

        all_test_ids = set(results_a.keys()).union(set(results_b.keys()))

        newly_failed = []
        resolved = []
        persistent_failed = []
        other_changes = []

        for tid in sorted(all_test_ids):
            rec_a = results_a.get(tid)
            rec_b = results_b.get(tid)

            out_a = rec_a.outcome if rec_a else "NOT_TESTED"
            out_b = rec_b.outcome if rec_b else "NOT_TESTED"

            meta = rec_b or rec_a
            item = {
                "test_id": tid,
                "title": meta.name,
                "category": meta.category,
                "severity": meta.severity,
                "outcome_run_a": out_a,
                "outcome_run_b": out_b
            }

            # Comparison Logic
            if out_a == "PASS" and out_b in ["FAIL", "REVIEW"]:
                item["status_change"] = "NEW_FAILURE"
                newly_failed.append(item)
            elif out_a in ["FAIL", "REVIEW"] and out_b == "PASS":
                item["status_change"] = "RESOLVED"
                resolved.append(item)
            elif out_a in ["FAIL", "REVIEW"] and out_b in ["FAIL", "REVIEW"]:
                item["status_change"] = "PERSISTENT_FAILURE"
                persistent_failed.append(item)
            elif out_a == "PASS" and out_b == "PASS":
                item["status_change"] = "SAME_PASS"
                other_changes.append(item)
            else:
                item["status_change"] = "INCONCLUSIVE"
                other_changes.append(item)

        delta_failed = run_b.failed_count - run_a.failed_count
        delta_pass_rate = round(
            ((run_b.passed_count / run_b.total_tests) if run_b.total_tests else 0) -
            ((run_a.passed_count / run_a.total_tests) if run_a.total_tests else 0),
            4
        ) * 100

        return {
            "run_a": run_a,
            "run_b": run_b,
            "newly_introduced_failures": newly_failed,
            "resolved_failures": resolved,
            "persistent_failures": persistent_failed,
            "other_changes": other_changes,
            "summary": {
                "new_failures_count": len(newly_failed),
                "resolved_count": len(resolved),
                "persistent_count": len(persistent_failed),
                "delta_failed": delta_failed,
                "delta_pass_percentage": delta_pass_rate
            }
        }

    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict[str, Any]:
        total_runs = db.query(func.count(EvaluationRun.id)).scalar() or 0
        total_tests = db.query(func.sum(EvaluationRun.total_tests)).scalar() or 0
        
        # Severity breakdown across all active findings
        findings_sev = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        findings_query = db.query(Finding.severity, func.count(Finding.id)).group_by(Finding.severity).all()
        for sev, count in findings_query:
            if sev in findings_sev:
                findings_sev[sev] = count

        # Overall pass rate across all tests executed
        total_passed = db.query(func.sum(EvaluationRun.passed_count)).scalar() or 0
        overall_pass_rate = round((total_passed / total_tests) * 100, 1) if total_tests > 0 else 0.0

        # Recent 5 runs
        recent_runs = db.query(EvaluationRun).order_by(EvaluationRun.created_at.desc()).limit(5).all()

        # Category breakdown
        cat_counts = {}
        findings_cat = db.query(Finding.category, Finding.severity, func.count(Finding.id)).group_by(Finding.category, Finding.severity).all()
        for cat, sev, cnt in findings_cat:
            if cat not in cat_counts:
                cat_counts[cat] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0, "TOTAL": 0}
            if sev in cat_counts[cat]:
                cat_counts[cat][sev] += cnt
            cat_counts[cat]["TOTAL"] += cnt

        latest_note = "Evaluation engine running in local deterministic mode. All 32 security scenarios available for assessment."
        if recent_runs:
            latest = recent_runs[0]
            latest_note = f"Latest run completed at {latest.completed_at.strftime('%Y-%m-%d %H:%M UTC')} with {latest.failed_count} findings across {latest.total_tests} test cases."

        return {
            "total_runs": total_runs,
            "total_tests_executed": total_tests,
            "findings_by_severity": findings_sev,
            "overall_pass_rate": overall_pass_rate,
            "recent_runs": recent_runs,
            "category_summary": cat_counts,
            "latest_status_note": latest_note
        }
