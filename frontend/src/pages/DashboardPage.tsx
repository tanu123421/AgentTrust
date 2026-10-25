import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Play,
  RotateCcw,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string, runId?: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, showToast }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading security evaluation metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="p-6 bg-red-950/40 border border-red-800 rounded-xl max-w-2xl mx-auto text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-red-200">Backend Communication Issue</h2>
          <p className="text-xs text-red-300/80 mt-1 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-850 hover:bg-red-800 text-white rounded-lg text-xs font-medium inline-flex items-center gap-2 transition-colors border border-red-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const sev = stats.findings_by_severity;
  const totalFindings = sev.CRITICAL + sev.HIGH + sev.MEDIUM + sev.LOW + sev.INFO;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Philosophy */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Security Evaluation Observability</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              AgentTrust: Test AI Agents. Measure Risk. Prove Reliability.
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Local-first automated evaluation platform assessing AI agents across direct prompt injection, canary leakage,
              unauthorized tool usage, RAG grounding reliability, and permission policies.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('lab')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-sm shadow-indigo-600/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Security Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Total Evaluations</div>
          <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">{stats.total_runs}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Historical persisted runs
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Test Scenarios Executed</div>
          <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">{stats.total_tests_executed}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> Across 10 security categories
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Overall Suite Pass Rate</div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{stats.overall_pass_rate}%</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Empirical benchmark adherence
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-400">Active Vulnerability Findings</div>
          <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">{totalFindings}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-rose-500" /> {sev.CRITICAL} Critical &bull; {sev.HIGH} High
          </div>
        </div>
      </div>

      {/* Severity Breakdown Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Active Findings Grouped by Severity</h3>
          <span className="text-xs text-slate-400">Transparent Rule Engine Results</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950/60 border border-rose-900/40 rounded-lg p-3 text-center">
            <div className="text-[11px] font-semibold uppercase text-rose-400 tracking-wider">Critical</div>
            <div className="text-xl font-bold text-rose-300 font-mono mt-1">{sev.CRITICAL}</div>
          </div>
          <div className="bg-slate-950/60 border border-orange-900/40 rounded-lg p-3 text-center">
            <div className="text-[11px] font-semibold uppercase text-orange-400 tracking-wider">High</div>
            <div className="text-xl font-bold text-orange-300 font-mono mt-1">{sev.HIGH}</div>
          </div>
          <div className="bg-slate-950/60 border border-amber-900/40 rounded-lg p-3 text-center">
            <div className="text-[11px] font-semibold uppercase text-amber-400 tracking-wider">Medium</div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-1">{sev.MEDIUM}</div>
          </div>
          <div className="bg-slate-950/60 border border-blue-900/40 rounded-lg p-3 text-center">
            <div className="text-[11px] font-semibold uppercase text-blue-400 tracking-wider">Low</div>
            <div className="text-xl font-bold text-blue-300 font-mono mt-1">{sev.LOW}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Info</div>
            <div className="text-xl font-bold text-slate-300 font-mono mt-1">{sev.INFO}</div>
          </div>
        </div>
      </div>

      {/* Recent Evaluation Runs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Recent Evaluation Runs</h3>
            <p className="text-xs text-slate-400 mt-0.5">Automated local test executions with full audit records</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
          >
            <span>View All Runs & Compare</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recent_runs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No evaluations executed yet. Click &quot;Launch Security Lab&quot; to perform your first evaluation run.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Target Profile</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Passed</th>
                  <th className="py-2.5 px-3 text-center">Failed</th>
                  <th className="py-2.5 px-3">Detection Rate</th>
                  <th className="py-2.5 px-3">Executed At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {stats.recent_runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {run.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200">
                      {run.agent_name || 'Agent Target'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-400 font-mono font-medium">
                      {run.passed_count}
                    </td>
                    <td className="py-3 px-3 text-center text-rose-400 font-mono font-medium">
                      {run.failed_count}
                    </td>
                    <td className="py-3 px-3 font-mono text-indigo-300">
                      {run.detection_rate !== null && run.detection_rate !== undefined
                        ? `${run.detection_rate}%`
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => onNavigate('reports', run.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700"
                      >
                        Report
                      </button>
                      <button
                        onClick={() => onNavigate('findings', run.id)}
                        className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-200 rounded text-[11px] font-medium border border-indigo-700/50"
                      >
                        Findings
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Core Principle Callout */}
      <div className="p-4 bg-slate-900/60 border-l-4 border-indigo-500 rounded-r-lg text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Core Evaluation Principle</span>
        </div>
        <p>
          A test result is empirical evidence regarding the specific scenario tested, not proof that an AI system is universally safe or unsafe.
          Deterministic rules provide actionable risk observability without exaggerated claims of universal protection.
        </p>
      </div>
    </div>
  );
};
