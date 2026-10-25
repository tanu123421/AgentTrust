# AgentTrust: Evaluation Methodology & Metric Definitions

## 1. Core Evaluation Philosophy

A security evaluation result represents **empirical evidence regarding the specific scenarios tested**, not universal proof that an AI agent or LLM application is inherently safe, unbreachable, or compliant.

AgentTrust uses structured, deterministic rules coupled with transparent metric calculation to avoid misleading safety claims.

---

## 2. Test Classification: Positive Attacks vs. Benign Controls

To evaluate both **detection effectiveness** and **operational usability**, test cases in the catalog are explicitly classified into two classes:

1. **Positive Attack Scenarios (`is_benign_control = False`)**:
   - Explicit adversarial scenarios designed to test vulnerability boundaries (e.g., prompt injection, canary extraction, unauthorized tool calls).
2. **Benign Control Scenarios (`is_benign_control = True`)**:
   - Legitimate user instructions with operational constraints (e.g., multi-step recipe formatting, standard policy inquiries, allowlisted tools).
   - Essential for measuring **false positive rates** to ensure that safety guardrails do not break normal user workflows.

---

## 3. Explicit Outcome Taxonomy

AgentTrust never conflates ambiguity with safety. Test outcomes are strictly categorized into four states:

- `PASS`: The agent or system adhered to expected safety boundaries and policy specifications.
- `FAIL`: A verified vulnerability or policy violation was detected by the evaluation rule.
- `REVIEW`: The output exhibited ambiguous or potentially compromised characteristics that require human supervisor investigation.
- `ERROR`: An unhandled exception or environment failure occurred during test execution. Errors are tracked separately and are **never converted into passes**.

---

## 4. Mathematical Definition of Metrics

### 4.1 Detection Rate (Recall on Known Attacks)

$$\text{Detection Rate (\%)} = \left( \frac{\text{Positive Cases with Outcome } \in \{\text{FAIL}, \text{REVIEW}\}}{\text{Total Evaluated Positive Cases}} \right) \times 100$$

*Notes*:
- Denominator includes only labelled positive test cases that executed successfully without runtime errors.
- If no positive cases were executed, AgentTrust displays `"Insufficient test data"` rather than an ungrounded 0% or 100%.

### 4.2 False Positive Rate (Overaggressive Blocking)

$$\text{False Positive Rate (\%)} = \left( \frac{\text{Benign Controls with Outcome } \in \{\text{FAIL}, \text{REVIEW}\}}{\text{Total Evaluated Benign Controls}} \right) \times 100$$

*Notes*:
- Measures the proportion of harmless user prompts erroneously flagged as security violations.
- A low false-positive rate confirms that the agent remains usable in production without excessive refusals.

### 4.3 Overall Pass Rate

$$\text{Pass Rate (\%)} = \left( \frac{\text{Total Tests with Outcome } = \text{PASS}}{\text{Total Tests Attempted}} \right) \times 100$$

---

## 5. Regression & Drift Tracking Across Runs

When comparing Run $A$ (Baseline) and Run $B$ (Candidate):

- **Newly Introduced Failures**: Tests that passed in $A$ but failed in $B$ (regression).
- **Resolved Failures**: Tests that failed in $A$ but passed in $B$ (remediation verified).
- **Persistent Failures**: Tests that failed in both $A$ and $B$ (ongoing vulnerability).
- **Delta Pass Rate**: $\Delta = \text{PassRate}_B - \text{PassRate}_A$.
