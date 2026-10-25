import {
  Project, AgentProfile, EvaluationRun, EvaluationRunDetail,
  EvaluationComparison, DashboardStats, EnvironmentStatus,
  Finding, ToolSimulationResult, ToolAuditLog
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      let errorMessage = `HTTP Error ${res.status} (${res.statusText})`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // ignore fallback
      }
      throw new Error(errorMessage);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('AgentTrust backend is currently offline or unreachable. Please verify that the backend server is running on http://127.0.0.1:8000.');
    }
    throw err;
  }
}

export const api = {
  // System & Health
  getStatus: () => request<EnvironmentStatus>('/status'),
  getHealth: () => request<{ status: string; service: string }>('/health'),
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  // Projects
  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  createProject: (data: { name: string; description?: string; target_type: string }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: { name?: string; description?: string; target_type?: string }) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Agent Profiles
  getProjectProfiles: (projectId: string) => request<AgentProfile[]>(`/projects/${projectId}/profiles`),
  getProfile: (id: string) => request<AgentProfile>(`/profiles/${id}`),
  createProfile: (data: any) => request<AgentProfile>(`/projects/${data.project_id}/profiles`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProfile: (id: string, data: any) => request<AgentProfile>(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProfile: (id: string) => request<void>(`/profiles/${id}`, { method: 'DELETE' }),

  // Test Cases
  getTestCases: () => request<{ categories: string[]; total_test_cases: number; test_cases: any[] }>('/test-cases'),

  // Evaluations
  runEvaluation: (data: {
    project_id: string;
    agent_profile_id: string;
    category_filter?: string[];
    custom_prompt?: string;
    simulated_agent_response?: string;
    notes?: string;
  }) => request<EvaluationRun>('/evaluations/run', { method: 'POST', body: JSON.stringify(data) }),
  getEvaluationRuns: (projectId?: string) =>
    request<EvaluationRun[]>(`/evaluations/runs${projectId ? `?project_id=${projectId}` : ''}`),
  getEvaluationRunDetail: (runId: string) => request<EvaluationRunDetail>(`/evaluations/runs/${runId}`),
  compareRuns: (runA: string, runB: string) =>
    request<EvaluationComparison>(`/evaluations/compare?run_a=${encodeURIComponent(runA)}&run_b=${encodeURIComponent(runB)}`),

  // Findings
  getFindings: (filters?: {
    run_id?: string;
    severity?: string;
    category?: string;
    status?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.run_id) params.append('run_id', filters.run_id);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString();
    return request<Finding[]>(`/findings${qs ? `?${qs}` : ''}`);
  },
  updateFindingStatus: (id: string, status: string, review_notes: string) =>
    request<Finding>(`/findings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, review_notes }),
    }),

  // Tool Simulation
  simulateTool: (data: {
    agent_profile_id?: string;
    tool_name: string;
    requested_action: string;
    input_payload?: Record<string, any>;
  }) => request<ToolSimulationResult>('/tools/simulate', { method: 'POST', body: JSON.stringify(data) }),
  getToolAuditLogs: () => request<ToolAuditLog[]>('/tools/audit-logs'),

  // Reports
  getJsonReportUrl: (runId: string) => `${API_BASE}/evaluations/runs/${runId}/report/json`,
  getHtmlReportUrl: (runId: string) => `${API_BASE}/evaluations/runs/${runId}/report/html`,
};
