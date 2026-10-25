# AgentTrust: REST API Reference & Examples

Base URL: `http://127.0.0.1:8000/api/v1`  
Interactive OpenAPI UI: `http://127.0.0.1:8000/docs`  
ReDoc UI: `http://127.0.0.1:8000/redoc`

---

## 1. System & Diagnostics

### 1.1 Health Check
```bash
curl -X GET http://127.0.0.1:8000/api/v1/health
```
**Response**:
```json
{
  "status": "ok",
  "service": "AgentTrust",
  "version": "1.0.0",
  "environment": "development"
}
```

### 1.2 Dashboard Statistics
```bash
curl -X GET http://127.0.0.1:8000/api/v1/dashboard/stats
```

---

## 2. Projects & Agent Profiles

### 2.1 List Projects
```bash
curl -X GET http://127.0.0.1:8000/api/v1/projects
```

### 2.2 Create Project
```bash
curl -X POST http://127.0.0.1:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Agent",
    "description": "Enterprise customer service bot with order lookup tools.",
    "target_type": "Tool-Augmented Agent"
  }'
```

### 2.3 Create Agent Profile
```bash
curl -X POST http://127.0.0.1:8000/api/v1/projects/{project_id}/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "{project_id}",
    "name": "SupportBot-v2",
    "model_provider": "offline-synthetic",
    "sensitivity_level": "Internal",
    "system_prompt_marker": "CANARY_SYSTEM_PROMPT_SECRET_0912",
    "tools_config": [
      {"name": "read_document", "permission": "allowed"},
      {"name": "send_email", "permission": "approval_required"},
      {"name": "delete_record", "permission": "denied"}
    ]
  }'
```

---

## 3. Security Lab & Evaluations

### 3.1 List Test Cases
```bash
curl -X GET http://127.0.0.1:8000/api/v1/test-cases
```

### 3.2 Execute Security Evaluation Run
```bash
curl -X POST http://127.0.0.1:8000/api/v1/evaluations/run \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "{project_id}",
    "agent_profile_id": "{agent_profile_id}",
    "notes": "CI/CD automated regression evaluation"
  }'
```

### 3.3 Compare Two Evaluation Runs
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/evaluations/compare?run_a={run_id_a}&run_b={run_id_b}"
```

---

## 4. Tool Permission Simulator

### 4.1 Evaluate Tool Request
```bash
curl -X POST http://127.0.0.1:8000/api/v1/tools/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "agent_profile_id": "{agent_profile_id}",
    "tool_name": "delete_record",
    "requested_action": "delete_account",
    "input_payload": {"user_id": 104}
  }'
```
**Response**:
```json
{
  "id": "1d8f1e2a-...",
  "tool_name": "delete_record",
  "requested_action": "delete_account",
  "decision": "DENIED",
  "reason": "Tool 'delete_record' is explicitly DENIED under the agent profile's least-privilege policy.",
  "simulated_execution_output": "[SIMULATION BLOCKED] Action 'delete_account' refused by policy gate.",
  "created_at": "2026-10-25T08:00:00Z"
}
```

---

## 5. Reports

### 5.1 Export Structured JSON Report
```bash
curl -X GET http://127.0.0.1:8000/api/v1/evaluations/runs/{run_id}/report/json
```

### 5.2 Export Standalone Print-Ready HTML Report
```bash
curl -X GET http://127.0.0.1:8000/api/v1/evaluations/runs/{run_id}/report/html -o report.html
```
