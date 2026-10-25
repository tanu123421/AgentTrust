# AgentTrust: Final-Year BCA Capstone Project Report Outline

**Project Title**: AgentTrust: Local-First AI Agent Security Evaluation and Observability Platform  
**Tagline**: *Test AI Agents. Measure Risk. Prove Reliability.*  
**Author**: BCA Final-Year Capstone Candidate  
**Domain**: AI Engineering, Application Security (AppSec), LLM Reliability, DevSecOps  

---

## 1. Abstract
As autonomous artificial intelligence agents and large language model (LLM) applications are increasingly entrusted with state-changing operations—such as database queries, API invocations, and email dispatches—they introduce critical security vulnerabilities, including prompt injection, canary leakage, and unauthorized tool invocation. AgentTrust is an engineering response to this paradigm shift: a local-first, privacy-preserving AI agent security testing platform. Utilizing deterministic rule matching, safe server-side tool simulation, and transparent metric computation, AgentTrust allows developers to benchmark AI systems before production deployment. The platform evaluates systems across 10 security categories and 32 structured scenarios, generating reproducible audit reports and side-by-side regression deltas without requiring external paid APIs or cloud dependencies.

---

## 2. Introduction & Problem Definition
Traditional software security auditing relies on deterministic static code analysis (SAST) and dynamic testing (DAST). In contrast, generative AI systems present probabilistic, non-deterministic behaviors driven by natural language prompts. An adversarial instruction embedded within untrusted web content or user input can hijack model execution, bypass system guardrails, or trigger unauthorized API commands. 

Organizations deploying AI agents currently lack accessible, reproducible, and offline-capable testing frameworks to systematically measure security posture prior to release. Existing solutions frequently require proprietary cloud API keys, upload sensitive internal prompts to external servers, or present vague "safety scores" devoid of empirical evidence.

---

## 3. Project Objectives & Scope

### 3.1 Objectives
1. Develop an offline, deterministic evaluation engine covering the OWASP Top 10 for LLMs and AI Agents.
2. Implement server-side policy enforcement for agent tool calls (enforcing least privilege and mandatory human approval gates).
3. Ensure automated sensitive canary token and synthetic PII redaction.
4. Provide side-by-side regression analysis to compare baseline and candidate evaluations.
5. Generate standalone, print-ready HTML and valid JSON audit reports without external telemetry.

### 3.2 Scope
- **In-Scope**: Local synthetic evaluation engine, 32 deterministic scenarios spanning 10 security categories, tool permission simulator, persistent SQLite database, React 19 single-page dashboard.
- **Out-of-Scope**: Exploitation of external public endpoints, automated black-hat penetration testing, or guarantees of universal mathematical security.

---

## 4. Literature Review & Industry References
- **NIST AI Risk Management Framework (AI RMF 1.0)**: Establishes governance, mapping, measurement, and management guidelines for trustworthy AI systems.
- **OWASP Top 10 for Large Language Model Applications (2025/2026)**:
  - LLM01: Prompt Injection (Direct & Indirect)
  - LLM02: Sensitive Information Disclosure
  - LLM04: Model Denial of Service & Resource Abuse
  - LLM06: Excessive Agency
  - LLM07: System Prompt Leakage
  - LLM09: Misinformation & Grounding Hallucination

---

## 5. Requirements Analysis

### 5.1 Functional Requirements (FR)
- **FR-01 (Project & Profile Management)**: CRUD operations for evaluation projects and agent profiles with configurable sensitivity levels.
- **FR-02 (Security Evaluation Execution)**: Selectable test categories, custom prompt evaluation, and live progress indicators.
- **FR-03 (Findings Explorer)**: Severity filtering, search, masked evidence viewer, and review status state machine (Open $\rightarrow$ Under Review $\rightarrow$ Accepted Risk $\rightarrow$ Mitigated).
- **FR-04 (Tool Policy Simulator)**: Server-side authorization check (`ALLOWED`, `REQUIRES_APPROVAL`, `DENIED`) and audit trail logging.
- **FR-05 (Run Comparison)**: Side-by-side diff tracking newly introduced and resolved failures across runs.
- **FR-06 (Export Capabilities)**: Direct browser download of JSON audit schemas and standalone escaped HTML reports.

### 5.2 Non-Functional Requirements (NFR)
- **NFR-01 (Privacy & Isolation)**: Zero required outbound internet connections; no API keys required.
- **NFR-02 (Safety)**: Zero execution of user-submitted shell code or unescaped HTML.
- **NFR-03 (Performance)**: Sub-second deterministic evaluation execution on standard consumer hardware.
- **NFR-04 (Portability)**: Cross-platform support (Windows PowerShell, Linux, macOS).

---

## 6. System Design & Architecture
*(Refer to `docs/ARCHITECTURE.md` for full component diagrams and database schemas).*

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts.
- **Backend**: FastAPI, SQLAlchemy 2.0, SQLite, Pydantic V2.
- **Security Middleware**: Evidence Masking DLP (`re.sub` canary masks), Server-side `ToolPolicyEngine`.

---

## 7. Implementation Highlights
- **Deterministic Matchers**: Implementation of regex and keyword boundary inspectors in `app/evaluation/engine.py`.
- **Canary Redaction**: Implementation of `app/security/masking.py` preventing sensitive tokens from appearing in findings.
- **Safe HTML Rendering**: Standalone report generation in `app/services/report_service.py` with `html.escape` output encoding to mitigate stored XSS.

---

## 8. Testing & Validation Results
- **Automated Backend Tests**: 14 comprehensive test cases covering health checks, project CRUD, payload bounds, rule refusal/compliance, canary leakage, tool authorization gates, and report escaping. All 14 tests pass (`pytest tests/ -v`).
- **Frontend Quality Gate**: Production compilation via `tsc -b && vite build` completed in 555ms with zero errors.

---

## 9. Limitations & Ethical Boundary
- Pattern matching cannot anticipate all semantic variations or multi-step linguistic obfuscations.
- A test result represents empirical evidence regarding tested scenarios, not universal mathematical proof of safety.

---

## 10. Conclusion & Future Enhancement
AgentTrust demonstrates that robust AI security evaluation can be achieved locally, deterministically, and transparently without relying on third-party cloud services. Future enhancements include multi-turn dialog state tracking, vector embeddings for semantic similarity scoring, and continuous integration (CI/CD) GitHub Actions plugins.
