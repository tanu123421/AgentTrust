import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  Layers,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { AgentProfile, ToolSimulationResult, ToolAuditLog } from '../types';

interface ToolSimulatorPageProps {
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ToolSimulatorPage: React.FC<ToolSimulatorPageProps> = ({ showToast }) => {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  const [toolName, setToolName] = useState<string>('send_email');
  const [requestedAction, setRequestedAction] = useState<string>('dispatch_promotional_campaign');
  const [payloadText, setPayloadText] = useState<string>('{\n  "recipient": "marketing-leads@example.com",\n  "subject": "Urgent Promotion"\n}');

  const [simulating, setSimulating] = useState(false);
  const [latestResult, setLatestResult] = useState<ToolSimulationResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<ToolAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchProfilesAndLogs = async () => {
    try {
      const projects = await api.getProjects();
      if (projects.length > 0) {
        const allProfiles: AgentProfile[] = [];
        for (const p of projects) {
          const profs = await api.getProjectProfiles(p.id);
          allProfiles.push(...profs);
        }
        setProfiles(allProfiles);
        if (allProfiles.length > 0 && !selectedProfileId) {
          setSelectedProfileId(allProfiles[0].id);
        }
      }
      const logs = await api.getToolAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load tool simulator data.');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchProfilesAndLogs();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);

    let parsedPayload = {};
    if (payloadText.trim()) {
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch (err) {
        showToast('error', 'Payload must be valid JSON format.');
        setSimulating(false);
        return;
      }
    }

    try {
      const res = await api.simulateTool({
        agent_profile_id: selectedProfileId || undefined,
        tool_name: toolName,
        requested_action: requestedAction.trim(),
        input_payload: parsedPayload,
      });
      setLatestResult(res);
      showToast('success', `Policy evaluated: ${res.decision}`);
      const updatedLogs = await api.getToolAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      showToast('error', err.message || 'Policy evaluation error.');
    } finally {
      setSimulating(false);
    }
  };

  const getDecisionBadge = (decision: string) => {
    if (decision === 'ALLOWED') {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> ALLOWED
        </span>
      );
    }
    if (decision === 'REQUIRES_APPROVAL') {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> REQUIRES APPROVAL
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1.5">
        <XCircle className="w-3.5 h-3.5" /> DENIED
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <span>Tool Permission Simulator</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Test server-side authorization policies, least-privilege enforcement, and human approval gates before deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Configuration */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200">Simulate Tool Request</h3>

          <form onSubmit={handleSimulate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Agent Profile Policy</label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Catalog Default Policies</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sensitivity_level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Tool to Invoke</label>
              <select
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="read_document">read_document (Low Risk)</option>
                <option value="search_records">search_records (Low Risk)</option>
                <option value="update_record">update_record (Medium Risk)</option>
                <option value="send_email">send_email (High Risk - Approval Gate)</option>
                <option value="delete_record">delete_record (Critical - Destructive)</option>
                <option value="execute_code">execute_code (Critical - Arbitrary Execution)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Requested Action Name</label>
              <input
                type="text"
                value={requestedAction}
                onChange={(e) => setRequestedAction(e.target.value)}
                placeholder="e.g., delete_customer_account, send_email"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Simulated Input Payload (JSON)</label>
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30 transition-colors"
            >
              {simulating ? (
                <span>Evaluating Policy...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Evaluate Policy Decision</span>
                </>
              )}
            </button>
          </form>

          {/* Core Safety Callout */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Simulation Safety Guarantee:</span>
            <p>
              Actions are evaluated and simulated strictly within server-side memory. No actual emails are sent, external accounts modified, or user files deleted.
            </p>
          </div>
        </div>

        {/* Right Column: Decision Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Server Policy Evaluation Result</h3>

            {latestResult ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-mono">{latestResult.tool_name}</span>
                    <h4 className="text-sm font-bold text-slate-100">{latestResult.requested_action}</h4>
                  </div>
                  <div>{getDecisionBadge(latestResult.decision)}</div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Server-Side Policy Reason:
                  </span>
                  <p className="text-slate-200 leading-relaxed">{latestResult.reason}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Simulated Execution Sandbox Output:
                  </span>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-300 whitespace-pre-wrap break-all">
                    {latestResult.simulated_execution_output}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-500">
                Click &quot;Evaluate Policy Decision&quot; to test whether the tool request is allowed, denied, or gated for supervisor approval.
              </div>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Tool Policy Audit Trail</h3>
              <span className="text-xs text-slate-400">Persisted Policy Enforcements</span>
            </div>

            {loadingLogs ? (
              <div className="p-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No policy invocations recorded in this session yet.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Tool</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Decision</th>
                      <th className="py-2 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-slate-300">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-2 px-3 font-mono text-[11px] text-indigo-300">{log.tool_name}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-300">{log.requested_action}</td>
                        <td className="py-2 px-3">{getDecisionBadge(log.decision)}</td>
                        <td className="py-2 px-3 text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
