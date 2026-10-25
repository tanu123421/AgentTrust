export interface ToolConfigItem {
  name: string;
  permission: 'allowed' | 'approval_required' | 'denied';
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  target_type: string;
  created_at: string;
  updated_at: string;
  profiles_count?: number;
  runs_count?: number;
}

export interface AgentProfile {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  model_provider: string;
  sensitivity_level: string;
  system_prompt_marker: string;
  tools_config: ToolConfigItem[];
  evaluation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  id: string;
  run_id: string;
  test_id: string;
  rule_id: string;
  category: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  outcome: 'FAIL' | 'REVIEW' | 'ERROR';
  evidence_masked: string;
  explanation: string;
  expected_behavior: string;
  observed_behavior: string;
  recommended_mitigation: string;
  detection_method: string;
  limitations_note: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ACCEPTED_RISK' | 'MITIGATED';
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TestExecutionRecord {
  id: string;
  run_id: string;
  test_id: string;
  rule_id: string;
  category: string;
  name: string;
  is_benign_control: boolean;
  outcome: 'PASS' | 'FAIL' | 'REVIEW' | 'ERROR';
  severity: string;
  input_scenario: string;
  observed_response?: string;
  explanation?: string;
  execution_time_ms: number;
  created_at: string;
}

export interface EvaluationRun {
  id: string;
  project_id: string;
  agent_profile_id: string;
  suite_version: string;
  engine_version: string;
  status: string;
  total_tests: number;
  passed_count: number;
  failed_count: number;
  review_count: number;
  error_count: number;
  detection_rate?: number;
  false_positive_rate?: number;
  execution_duration_ms: number;
  target_summary?: Record<string, any>;
  notes?: string;
  created_at: string;
  completed_at: string;
  agent_name?: string;
  project_name?: string;
}

export interface EvaluationRunDetail extends EvaluationRun {
  findings: Finding[];
  test_results: TestExecutionRecord[];
}

export interface RunComparisonFinding {
  test_id: string;
  title: string;
  category: string;
  severity: string;
  outcome_run_a?: string;
  outcome_run_b?: string;
  status_change: 'NEW_FAILURE' | 'RESOLVED' | 'PERSISTENT_FAILURE' | 'SAME_PASS' | 'INCONCLUSIVE';
}

export interface EvaluationComparison {
  run_a: EvaluationRun;
  run_b: EvaluationRun;
  newly_introduced_failures: RunComparisonFinding[];
  resolved_failures: RunComparisonFinding[];
  persistent_failures: RunComparisonFinding[];
  other_changes: RunComparisonFinding[];
  summary: {
    new_failures_count: number;
    resolved_count: number;
    persistent_count: number;
    delta_failed: number;
    delta_pass_percentage: number;
  };
}

export interface DashboardStats {
  total_runs: number;
  total_tests_executed: number;
  findings_by_severity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFO: number;
  };
  overall_pass_rate: number;
  recent_runs: EvaluationRun[];
  category_summary: Record<string, { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number; INFO: number; TOTAL: number }>;
  latest_status_note: string;
}

export interface EnvironmentStatus {
  app_name: string;
  version: string;
  environment: string;
  database_status: string;
  active_test_definitions: number;
  available_categories: string[];
  llm_integration_status: string;
  api_docs_url: string;
}

export interface ToolSimulationResult {
  id: string;
  tool_name: string;
  requested_action: string;
  decision: 'ALLOWED' | 'DENIED' | 'REQUIRES_APPROVAL';
  reason: string;
  simulated_execution_output?: string;
  created_at: string;
}

export interface ToolAuditLog {
  id: string;
  agent_profile_id?: string;
  tool_name: string;
  requested_action: string;
  input_payload?: string;
  decision: string;
  reason: string;
  simulated_execution_output?: string;
  created_at: string;
}
