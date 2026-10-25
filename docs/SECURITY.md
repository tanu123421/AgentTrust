# AgentTrust: Security & Responsible Testing Guidelines

## 1. Principles of Responsible AI Testing

AgentTrust is engineered exclusively for authorized security assessment and quality assurance of AI agents and LLM applications.

1. **Authorized Scope Only**: Never evaluate agents or applications without explicit written permission from the system owner.
2. **Safe Local Simulation**: All built-in simulated tools (`send_email`, `delete_record`, `update_record`) execute in sandboxed memory mocks. The core demo never sends real emails, deletes external database records, or executes arbitrary shell code.
3. **Synthetic Canaries Only**: Testing sensitive information leakage relies strictly on synthetic markers (e.g. `TEST_API_KEY_DO_NOT_USE_9921` or `CANARY_SYSTEM_PROMPT_SECRET_0912`). Never test using production credentials or real customer PII.

---

## 2. Secrets & Credential Management

- **Zero-Key Requirement**: The core AgentTrust application functions completely offline without requiring API keys or cloud provider accounts.
- **Environment Variable Isolation**: If an optional LLM adapter is configured, credentials must be passed exclusively via environment variables (`.env`).
- **Never Hardcode Secrets**: API keys, database credentials, and session tokens must never be hardcoded or checked into version control.
- **Automated Evidence Masking**: Before storing or rendering test evidence, AgentTrust filters outputs through `mask_sensitive_evidence()`, masking API keys (`***MASKED***`), SSNs (`***-**-****`), and credit card sequences.

---

## 3. Safe Deployment Hardening

For teams deploying AgentTrust across a local network or shared staging environment:

1. **Bind to Localhost by Default**: Run uvicorn on `127.0.0.1` unless behind an authenticated reverse proxy (e.g., NGINX with TLS).
2. **CORS Restrictions**: In `backend/.env`, set `CORS_ORIGINS` strictly to your authorized frontend domains.
3. **Database Permissions**: Ensure the local SQLite database file (`agent_trust.db`) is restricted to the operating system user running the service.
4. **Debug Flags**: Keep `DEBUG=False` in production to prevent stack trace disclosures.
