import html
from typing import Dict, Any
from app.models.models import EvaluationRun

class ReportService:
    @staticmethod
    def generate_json_report(run: EvaluationRun) -> Dict[str, Any]:
        """Produces a structured, valid JSON security evaluation report."""
        agent = run.agent_profile
        project = run.project

        return {
            "report_metadata": {
                "platform": "AgentTrust",
                "tagline": "Test AI Agents. Measure Risk. Prove Reliability.",
                "report_format_version": "1.0.0",
                "generated_at": run.completed_at.isoformat() if run.completed_at else None,
                "disclaimer": "This report provides empirical evidence for the specific scenarios evaluated. It is not a formal certification of universal safety."
            },
            "evaluation_run": {
                "run_id": run.id,
                "status": run.status,
                "suite_version": run.suite_version,
                "engine_version": run.engine_version,
                "started_at": run.created_at.isoformat() if run.created_at else None,
                "completed_at": run.completed_at.isoformat() if run.completed_at else None,
                "execution_duration_ms": run.execution_duration_ms,
                "notes": run.notes
            },
            "target_system": {
                "project_id": project.id if project else None,
                "project_name": project.name if project else "Unknown Project",
                "target_type": project.target_type if project else "General Agent",
                "agent_id": agent.id if agent else None,
                "agent_name": agent.name if agent else "Unknown Agent",
                "model_provider": agent.model_provider if agent else "offline-synthetic",
                "sensitivity_level": agent.sensitivity_level if agent else "Internal",
                "tools_configured_count": len(agent.tools_config or []) if agent else 0
            },
            "summary_metrics": {
                "total_tests_attempted": run.total_tests,
                "passed": run.passed_count,
                "failed": run.failed_count,
                "review_required": run.review_count,
                "execution_errors": run.error_count,
                "pass_rate_percentage": round((run.passed_count / run.total_tests) * 100, 1) if run.total_tests else 0.0,
                "detection_rate_positive_cases": f"{run.detection_rate}%" if run.detection_rate is not None else "Insufficient test data",
                "false_positive_rate_benign_controls": f"{run.false_positive_rate}%" if run.false_positive_rate is not None else "Insufficient test data"
            },
            "findings": [
                {
                    "finding_id": f.id,
                    "test_id": f.test_id,
                    "rule_id": f.rule_id,
                    "category": f.category,
                    "title": f.title,
                    "severity": f.severity,
                    "outcome": f.outcome,
                    "status": f.status,
                    "evidence_snippet": f.evidence_masked,
                    "explanation": f.explanation,
                    "expected_behavior": f.expected_behavior,
                    "observed_behavior": f.observed_behavior,
                    "recommended_mitigation": f.recommended_mitigation,
                    "detection_method": f.detection_method,
                    "limitations_note": f.limitations_note,
                    "review_notes": f.review_notes,
                    "timestamp": f.created_at.isoformat() if f.created_at else None
                }
                for f in run.findings
            ],
            "test_execution_records": [
                {
                    "test_id": r.test_id,
                    "rule_id": r.rule_id,
                    "category": r.category,
                    "name": r.name,
                    "is_benign_control": r.is_benign_control,
                    "outcome": r.outcome,
                    "severity": r.severity,
                    "duration_ms": r.execution_time_ms
                }
                for r in run.test_results
            ]
        }

    @staticmethod
    def generate_html_report(run: EvaluationRun) -> str:
        """
        Generates a standalone, beautiful HTML security evaluation report.
        Safely escapes all untrusted content with html.escape.
        """
        agent = run.agent_profile
        project = run.project

        project_name = html.escape(project.name if project else "Evaluation Target")
        agent_name = html.escape(agent.name if agent else "Target Agent")
        provider = html.escape(agent.model_provider if agent else "offline-synthetic")
        sensitivity = html.escape(agent.sensitivity_level if agent else "Internal")
        run_id = html.escape(str(run.id or "N/A"))
        created_time = html.escape(run.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if run.created_at else "N/A")

        
        det_rate = f"{run.detection_rate}%" if run.detection_rate is not None else "Insufficient test data"
        fp_rate = f"{run.false_positive_rate}%" if run.false_positive_rate is not None else "Insufficient test data"

        findings_rows = []
        for f in run.findings:
            sev_color = {
                "CRITICAL": "#ef4444",
                "HIGH": "#f97316",
                "MEDIUM": "#eab308",
                "LOW": "#3b82f6",
                "INFO": "#94a3b8"
            }.get(f.severity, "#94a3b8")

            findings_rows.append(f"""
            <div class="finding-card" style="border-left: 4px solid {sev_color};">
                <div class="finding-header">
                    <span class="badge" style="background-color: {sev_color}22; color: {sev_color}; border: 1px solid {sev_color};">{html.escape(f.severity)}</span>
                    <span class="finding-rule">{html.escape(f.rule_id)} &bull; {html.escape(f.category)}</span>
                    <span class="badge status-badge">{html.escape(f.status)}</span>
                </div>
                <h3 class="finding-title">{html.escape(f.title)}</h3>
                <p class="finding-desc">{html.escape(f.explanation)}</p>
                
                <div class="evidence-box">
                    <strong>Evidence (Canary/PII Masked):</strong>
                    <pre><code>{html.escape(f.evidence_masked)}</code></pre>
                </div>

                <div class="grid-2">
                    <div>
                        <strong>Expected Behavior:</strong>
                        <p>{html.escape(f.expected_behavior)}</p>
                    </div>
                    <div>
                        <strong>Observed Behavior:</strong>
                        <p>{html.escape(f.observed_behavior)}</p>
                    </div>
                </div>

                <div class="remediation-box">
                    <strong>Recommended Remediation:</strong>
                    <p>{html.escape(f.recommended_mitigation)}</p>
                </div>

                <div class="limitations-note">
                    <em>Detection Limitations:</em> {html.escape(f.limitations_note)}
                </div>
            </div>
            """)

        findings_html = "".join(findings_rows) if findings_rows else "<p style='color:#10b981; padding: 20px 0;'>No security vulnerabilities or policy violations detected in evaluated suite.</p>"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentTrust Security Report - {project_name}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f17;
            color: #f1f5f9;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: #111827;
            border-radius: 12px;
            padding: 40px;
            border: 1px solid #1f2937;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }}
        .header {{
            border-bottom: 1px solid #1f2937;
            padding-bottom: 24px;
            margin-bottom: 30px;
        }}
        .brand {{
            font-size: 24px;
            font-weight: 700;
            color: #60a5fa;
            letter-spacing: -0.5px;
        }}
        .tagline {{
            color: #94a3b8;
            font-size: 14px;
        }}
        h1 {{
            font-size: 28px;
            margin: 16px 0 8px 0;
            color: #ffffff;
        }}
        .meta-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            background: #1f293788;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 14px;
        }}
        .meta-grid div strong {{
            color: #94a3b8;
            display: block;
            font-size: 12px;
            text-transform: uppercase;
        }}
        .metrics-cards {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 36px;
        }}
        .metric-card {{
            background: #1e293b;
            padding: 18px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #334155;
        }}
        .metric-val {{
            font-size: 26px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 4px;
        }}
        .metric-label {{
            font-size: 12px;
            color: #94a3b8;
            text-transform: uppercase;
        }}
        .finding-card {{
            background: #1e293b88;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }}
        .finding-header {{
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }}
        .badge {{
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
        }}
        .status-badge {{
            background: #334155;
            color: #e2e8f0;
            margin-left: auto;
        }}
        .finding-rule {{
            font-size: 13px;
            color: #94a3b8;
            font-family: monospace;
        }}
        .finding-title {{
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #f8fafc;
        }}
        .finding-desc {{
            color: #cbd5e1;
            font-size: 14px;
            margin-bottom: 16px;
        }}
        .evidence-box {{
            background: #0f172a;
            border: 1px solid #334155;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 14px;
            font-size: 13px;
        }}
        .evidence-box pre {{
            margin: 6px 0 0 0;
            color: #e2e8f0;
            white-space: pre-wrap;
            word-break: break-all;
            font-family: monospace;
        }}
        .grid-2 {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            font-size: 13px;
            margin-bottom: 14px;
        }}
        .grid-2 strong {{
            color: #94a3b8;
            display: block;
            margin-bottom: 4px;
        }}
        .grid-2 p {{
            margin: 0;
            color: #e2e8f0;
        }}
        .remediation-box {{
            background: #14532d33;
            border: 1px solid #15803d;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 13px;
            color: #bbf7d0;
        }}
        .remediation-box strong {{
            color: #4ade80;
            display: block;
            margin-bottom: 4px;
        }}
        .remediation-box p {{
            margin: 0;
        }}
        .limitations-note {{
            font-size: 12px;
            color: #94a3b8;
        }}
        .disclaimer-banner {{
            margin-top: 40px;
            padding: 16px;
            background: #1e1e24;
            border-left: 4px solid #60a5fa;
            border-radius: 4px;
            font-size: 12px;
            color: #94a3b8;
        }}
        @media print {{
            body {{
                background: #ffffff;
                color: #000000;
                padding: 0;
            }}
            .container {{
                background: #ffffff;
                border: none;
                box-shadow: none;
                padding: 0;
            }}
            .finding-card, .metric-card, .meta-grid {{
                border-color: #cbd5e1;
                background: #f8fafc;
                color: #0f172a;
            }}
            .finding-title, h1, .metric-val {{
                color: #0f172a;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">AgentTrust</div>
            <div class="tagline">Test AI Agents. Measure Risk. Prove Reliability.</div>
            <h1>AI Security & Reliability Evaluation Report</h1>
            <div>Target: <strong>{project_name}</strong> &bull; Agent: <strong>{agent_name}</strong></div>
        </div>

        <div class="meta-grid">
            <div><strong>Run ID</strong>{run_id}</div>
            <div><strong>Executed At</strong>{created_time}</div>
            <div><strong>Model / Profile</strong>{provider}</div>
            <div><strong>Sensitivity</strong>{sensitivity}</div>
        </div>

        <div class="metrics-cards">
            <div class="metric-card">
                <div class="metric-label">Total Tests</div>
                <div class="metric-val">{run.total_tests}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Pass / Fail</div>
                <div class="metric-val" style="color: #10b981;">{run.passed_count} <span style="font-size: 16px; color: #ef4444;">/ {run.failed_count}</span></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Detection Rate</div>
                <div class="metric-val" style="color: #60a5fa;">{det_rate}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">False Positive Rate</div>
                <div class="metric-val" style="color: #a78bfa;">{fp_rate}</div>
            </div>
        </div>

        <h2 style="font-size: 20px; border-bottom: 1px solid #1f2937; padding-bottom: 8px; margin-bottom: 20px;">
            Security Findings ({len(run.findings)})
        </h2>

        {findings_html}

        <div class="disclaimer-banner">
            <strong>Evaluation Principles & Limitations:</strong><br>
            A test result is empirical evidence regarding the specific scenario tested, not absolute proof that an AI agent or LLM application is universally safe, unbreachable, or compliant. Deterministic pattern matching and safe simulation provide actionable vulnerability auditing without false assurances.
        </div>
    </div>
</body>
</html>
"""
