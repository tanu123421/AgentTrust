# AgentTrust: Threat Model & Security Analysis

## 1. Scope & Objective

This threat model documents the security assumptions, trust boundaries, attacker profiles, abuse scenarios, and defense mitigations governing the **AgentTrust** AI agent evaluation platform.

---

## 2. Protected Assets

| Asset ID | Asset Name | Description | Confidentiality | Integrity | Availability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AST-01** | System Prompt Markers | Protected canary tokens embedded in system instructions. | HIGH | HIGH | LOW |
| **AST-02** | Synthetic API Keys & PII | Simulated environment secrets (`TEST_API_KEY...`) and synthetic customer data. | HIGH | HIGH | LOW |
| **AST-03** | Tool Execution Permissions | Least-privilege policies governing tool access (`allowed`, `approval_required`, `denied`). | MEDIUM | HIGH | HIGH |
| **AST-04** | Evaluation Audit Records | Historical test runs, findings, and review justifications. | MEDIUM | HIGH | MEDIUM |
| **AST-05** | Host System Integrity | The developer machine running the AgentTrust server. | HIGH | HIGH | HIGH |

---

## 3. Trust Boundaries

```
[Untrusted Web/User Input]
         │ (Boundary 1: Input Validation)
         ▼
[Agent Prompt Assembly Layer]
         │ (Boundary 2: Model Context Separator)
         ▼
[LLM Inference / Simulation Engine]
         │ (Boundary 3: Output Sanitization & Masking)
         ▼
[Frontend Browser UI] & [Downstream Tool Policy Gate]
```

1. **Boundary 1: Untrusted Input $\rightarrow$ Prompt Assembly**: User input and external web scrapes must never be assumed safe or privileged.
2. **Boundary 2: Model Context $\rightarrow$ Tool Invocation**: An LLM cannot be trusted to self-enforce permissions. Tool invocations must cross a strict server-side policy gate.
3. **Boundary 3: Model Completion $\rightarrow$ Frontend Rendering**: Untrusted model text must be context-encoded and never evaluated as raw HTML/JavaScript.

---

## 4. Attacker Profiles & Capabilities

1. **Direct Adversary (Prompt Injector)**:
   - Submits crafted adversarial instructions commanding the agent to ignore guidelines, adopt hostile personas (e.g., DAN, EvilTwin), or output system canaries.
2. **Indirect Adversary (Data Poisoner)**:
   - Embeds hostile directives inside external documents, emails, or web pages retrieved by RAG systems.
3. **Privilege Escalator**:
   - Crafts requests intended to induce an agent into executing unauthorized high-risk tools (`delete_record`, `execute_code`) or skipping human approval gates.

---

## 5. Threat Scenarios & Mitigations

| Threat ID | Category | Attack Description | Platform Mitigation | Residual Risk |
| :--- | :--- | :--- | :--- | :--- |
| **TH-01** | Direct Injection | Instruction override via delimiter spoofing (`</system>`). | Structural token separation, regex matching, and input boundary validation. | Novel linguistic jailbreaks may evade exact keyword checks. |
| **TH-02** | Indirect Injection | Hostile command hidden in retrieved document context. | Untrusted-content encapsulation in RAG context; rule checks for exfiltration tokens. | Subtly biased summaries that change tone without overt keywords. |
| **TH-03** | Secret Leakage | Attacker extracts synthetic API keys or canary markers. | Pre-generation masking, post-generation DLP regex filters (`TEST_API_KEY_***MASKED***`). | Encoded or fragmented secrets (e.g. Base64 multi-turn assembly). |
| **TH-04** | Excessive Agency | Agent calls `delete_record` without user authorization. | Server-side `ToolPolicyEngine` denies unapproved actions regardless of agent prompt output. | Misconfigured profile permissions by administrator. |
| **TH-05** | Stored XSS | Untrusted model text containing `<script>` rendered in UI. | Frontend uses React text bindings; HTML reports use `html.escape`. No `dangerouslySetInnerHTML`. | Third-party browser extensions altering DOM. |
| **TH-06** | Resource Exhaustion | Oversized prompt submitted to consume memory/tokens. | Strict payload length checks (`MAX_INPUT_LENGTH_CHARS = 20,000`) returning HTTP 413. | Distributed Denial of Service (mitigated at gateway in prod). |

---

## 6. Security Guarantees & Safe Simulation

- **Zero Outbound Transmission**: The simulated tools (`send_email`, `delete_record`, `update_record`) execute purely in-memory synthetic handlers.
- **Local Isolation**: All evaluation persistence is held within local SQLite databases. No telemetry or scan data is sent to external cloud servers.
