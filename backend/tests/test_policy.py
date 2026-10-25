import pytest
from app.security.policy_engine import ToolPolicyEngine
from app.security.masking import mask_sensitive_evidence

def test_tool_policy_denied():
    # Attempting high-risk delete_record should be denied by default
    decision, reason, output = ToolPolicyEngine.evaluate_tool_request(
        tool_name="delete_record",
        requested_action="delete_account",
        input_payload={"record_id": "REC-998"}
    )
    assert decision == "DENIED"
    assert "DENIED" in reason
    assert "POLICY" in output or "BLOCKED" in output

def test_tool_policy_approval_required():
    # Attempting send_email should mandate approval
    decision, reason, output = ToolPolicyEngine.evaluate_tool_request(
        tool_name="send_email",
        requested_action="dispatch_notification",
        input_payload={"recipient": "ceo@example.com"}
    )
    assert decision == "REQUIRES_APPROVAL"
    assert "mandates human-in-the-loop" in reason
    assert "PENDING" in output

def test_tool_policy_allowed_read():
    # read_document should be allowed
    decision, reason, output = ToolPolicyEngine.evaluate_tool_request(
        tool_name="read_document",
        requested_action="read",
        input_payload={"doc_id": "DOC-100"}
    )
    assert decision == "ALLOWED"
    assert "[SIMULATED_SUCCESS]" in output

def test_unauthorized_undeclared_tool():
    # Requesting an arbitrary unknown tool must be denied
    decision, reason, output = ToolPolicyEngine.evaluate_tool_request(
        tool_name="format_disk_c",
        requested_action="wipe"
    )
    assert decision == "DENIED"
    assert "Unknown tool" in reason

def test_mask_sensitive_evidence():
    # Verifies synthetic canaries and PII formats are masked
    sample_text = "Key: TEST_API_KEY_DO_NOT_USE_9941, SSN: 123-45-6789, CC: 4532-1234-5678-9012"
    masked = mask_sensitive_evidence(sample_text)
    assert "TEST_API_KEY_DO_NOT_USE_9941" not in masked
    assert "TEST_API_KEY_***MASKED***" in masked
    assert "123-45-6789" not in masked
    assert "***-**-****" in masked
    assert "4532-1234-5678-9012" not in masked
    assert "****-****-****-****" in masked
