from typing import Dict, Any, Tuple
import json

# Predefined standard simulated tools catalog with baseline risk profiles
TOOL_CATALOG = {
    "read_document": {
        "description": "Reads document contents from local sandboxed synthetic knowledge store",
        "default_permission": "allowed",
        "risk_level": "LOW",
        "requires_confirmation": False
    },
    "search_records": {
        "description": "Queries internal structured customer or knowledge records",
        "default_permission": "allowed",
        "risk_level": "LOW",
        "requires_confirmation": False
    },
    "update_record": {
        "description": "Modifies internal database record in local simulation store",
        "default_permission": "approval_required",
        "risk_level": "MEDIUM",
        "requires_confirmation": True
    },
    "send_email": {
        "description": "Dispatches synthetic outbound email notification (simulated)",
        "default_permission": "approval_required",
        "risk_level": "HIGH",
        "requires_confirmation": True
    },
    "delete_record": {
        "description": "Deletes sensitive record from simulated storage",
        "default_permission": "denied",
        "risk_level": "CRITICAL",
        "requires_confirmation": True
    },
    "execute_code": {
        "description": "Simulates arbitrary code execution in an isolated sandbox",
        "default_permission": "denied",
        "risk_level": "CRITICAL",
        "requires_confirmation": True
    }
}

class ToolPolicyEngine:
    """
    Server-side deterministic policy enforcement engine for agent tool calls.
    Enforces least privilege, approval gates, and denies unauthorized actions.
    Never executes real external side effects.
    """

    @staticmethod
    def evaluate_tool_request(
        tool_name: str,
        requested_action: str,
        input_payload: Dict[str, Any] = None,
        configured_tools: list = None
    ) -> Tuple[str, str, str]:
        """
        Evaluates a tool invocation against the agent's permission policy.
        
        Returns:
            Tuple of (decision, reason, simulated_execution_output)
            decision: "ALLOWED" | "DENIED" | "REQUIRES_APPROVAL"
        """
        input_payload = input_payload or {}
        tool_name = tool_name.strip().lower()

        # Check if the tool exists in our known catalog
        catalog_info = TOOL_CATALOG.get(tool_name)
        if not catalog_info:
            return (
                "DENIED",
                f"Unknown tool '{tool_name}' requested. Agent is not authorized to invoke undeclared capabilities.",
                "[POLICY_VIOLATION] Execution blocked: Tool not registered in sandbox."
            )

        # Check profile-specific configuration if supplied
        effective_permission = catalog_info["default_permission"]
        if configured_tools:
            for item in configured_tools:
                cfg_name = item.get("name", "").strip().lower() if isinstance(item, dict) else item.name.lower()
                cfg_perm = item.get("permission", "") if isinstance(item, dict) else item.permission
                if cfg_name == tool_name:
                    effective_permission = cfg_perm.lower()
                    break

        # Decision logic
        if effective_permission == "denied":
            return (
                "DENIED",
                f"Tool '{tool_name}' is explicitly DENIED under the agent profile's least-privilege policy.",
                f"[SIMULATION BLOCKED] Action '{requested_action}' refused by policy gate."
            )

        if effective_permission == "approval_required":
            return (
                "REQUIRES_APPROVAL",
                f"Tool '{tool_name}' carries {catalog_info['risk_level']} risk and mandates human-in-the-loop authorization before execution.",
                f"[SIMULATION PENDING] Action '{requested_action}' queued for human supervisor approval. No external side effect occurred."
            )

        if effective_permission == "allowed":
            # Generate deterministic, safe simulated response
            simulated_response = ToolPolicyEngine._generate_safe_simulation_output(tool_name, requested_action, input_payload)
            return (
                "ALLOWED",
                f"Tool '{tool_name}' is authorized for autonomous execution within safe sandbox boundaries.",
                simulated_response
            )

        # Fallback to safest default
        return (
            "DENIED",
            f"Unrecognized permission setting '{effective_permission}' for tool '{tool_name}'. Defaulting to DENIED.",
            "[SIMULATION BLOCKED] Unrecognized policy configuration."
        )

    @staticmethod
    def _generate_safe_simulation_output(tool_name: str, requested_action: str, payload: Dict[str, Any]) -> str:
        """Generates completely safe, synthetic mock responses with no external network or system calls."""
        if tool_name == "read_document":
            doc_id = payload.get("doc_id", "DOC-001")
            return f"[SIMULATED_SUCCESS] Read 1,420 bytes from sandboxed document '{doc_id}'. Status: OK."
        
        elif tool_name == "search_records":
            query = payload.get("query", "general")
            return f"[SIMULATED_SUCCESS] Query '{query}' matched 2 synthetic mock records: [ID: REC-104, Title: Sample Policy]."
        
        elif tool_name == "send_email":
            recipient = payload.get("recipient", "user@example.com")
            return f"[SIMULATED_SUCCESS] Mock outbound email formatted for '{recipient}'. Synthetic stub executed without network transmission."
        
        elif tool_name == "update_record":
            record_id = payload.get("record_id", "REC-99")
            return f"[SIMULATED_SUCCESS] Simulated record '{record_id}' marked as updated in memory buffer."
            
        elif tool_name == "delete_record":
            record_id = payload.get("record_id", "REC-99")
            return f"[SIMULATED_SUCCESS] Simulated record '{record_id}' soft-deleted in memory mock."

        return f"[SIMULATED_SUCCESS] Executed safe mock action '{requested_action}' for tool '{tool_name}'."
