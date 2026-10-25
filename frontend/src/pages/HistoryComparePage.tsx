import React, { useEffect, useState } from 'react';
import {
  History,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationRun, EvaluationComparison } from '../types';

interface HistoryComparePageProps {
  onNavigate: (tab: string, runId?: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const HistoryComparePage: React.FC<HistoryComparePageProps> = ({ onNavigate, showToast }) => {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [loading, setLoading] = useState(true);

  // Compare Selector State
  const [runAId, setRunAId] = useState<string>('');
  const [runBId, setRunBId] = useState<string>('');
  const [comparison, setComparison] = useState<EvaluationComparison | null>(null);
  const [comparing, setComparing] = useState(false);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await api.getEvaluationRuns();
      setRuns(data);
      if (data.length >= 2) {
        setRunAId(data[1].id); // earlier run
        setRunBId(data[0].id); // latest run
      } else if (data.length === 1) {
        setRunAId(data[0].id);
        setRunBId(data[0].id);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load evaluation runs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRunComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runAId || !runBId) {
      showToast('error', 'Select two evaluation runs to compare.');
      return;
    }

    setComparing(true);
    try {
      const res = await api.compareRuns(runAId, runBId);
      setComparison(res);
      showToast('success', 'Comparison calculated successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to compare runs.');
    } finally {
      setComparing(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
      HIGH: 'text-orange-400 bg-orange-950/60 border-orange-800/60',
      MEDIUM: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      LOW: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${colors[sev] || colors.LOW}`}>
        {sev}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <span>Evaluation History & Regression Compare</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Track model and policy regression across benchmark evaluations, detect newly introduced vulnerabilities, and verify fixes.
        </p>
      </div>

      {/* Comparison Selector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">Side-by-Side Run Comparison Tool</h3>
        </div>

        <form onSubmit={handleRunComparison} className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block text-slate-400 font-medium mb-1">Baseline Run (Run A)</label>
            <select
              value={runAId}
              onChange={(e) => setRunAId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Baseline Run</option>
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.agent_name || 'Agent'} &bull; {new Date(r.created_at).toLocaleString()} ({r.failed_count} fails)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-400 font-medium mb-1">Candidate Run (Run B)</label>
            <select
              value={runBId}
              onChange={(e) => setRunBId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Candidate Run</option>
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.agent_name || 'Agent'} &bull; {new Date(r.created_at).toLocaleString()} ({r.failed_count} fails)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={comparing || !runAId || !runBId}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              {comparing ? <span>Comparing...</span> : <span>Calculate Diff</span>}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Diff Results */}
      {comparison && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Delta Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[11px] font-semibold text-rose-400 uppercase">Newly Introduced Failures</div>
              <div className="text-2xl font-bold text-rose-300 font-mono mt-1">
                {comparison.summary.new_failures_count}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase">Resolved Vulnerabilities</div>
              <div className="text-2xl font-bold text-emerald-300 font-mono mt-1">
                {comparison.summary.resolved_count}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[11px] font-semibold text-amber-400 uppercase">Persistent Failures</div>
              <div className="text-2xl font-bold text-amber-300 font-mono mt-1">
                {comparison.summary.persistent_count}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[11px] font-semibold text-indigo-400 uppercase">Delta Pass Rate</div>
              <div className={`text-2xl font-bold font-mono mt-1 ${
                comparison.summary.delta_pass_percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {comparison.summary.delta_pass_percentage > 0 ? '+' : ''}
                {comparison.summary.delta_pass_percentage.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Newly Introduced Failures Table */}
          {comparison.newly_introduced_failures.length > 0 && (
            <div className="bg-slate-900 border border-rose-900/50 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Newly Introduced Vulnerabilities ({comparison.newly_introduced_failures.length})</span>
              </h4>
              <div className="divide-y divide-slate-800/80">
                {comparison.newly_introduced_failures.map((item) => (
                  <div key={item.test_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-rose-400 font-semibold">{item.test_id}</span>
                      <span className="text-slate-200">{item.title}</span>
                      <span className="text-slate-500 text-[11px] hidden sm:inline">&bull; {item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(item.severity)}
                      <span className="text-[11px] font-mono text-rose-400">
                        {item.outcome_run_a} &rarr; {item.outcome_run_b}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Vulnerabilities Table */}
          {comparison.resolved_failures.length > 0 && (
            <div className="bg-slate-900 border border-emerald-900/50 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolved Vulnerabilities ({comparison.resolved_failures.length})</span>
              </h4>
              <div className="divide-y divide-slate-800/80">
                {comparison.resolved_failures.map((item) => (
                  <div key={item.test_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-semibold">{item.test_id}</span>
                      <span className="text-slate-200">{item.title}</span>
                      <span className="text-slate-500 text-[11px] hidden sm:inline">&bull; {item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(item.severity)}
                      <span className="text-[11px] font-mono text-emerald-400">
                        {item.outcome_run_a} &rarr; {item.outcome_run_b}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Persistent Failures Table */}
          {comparison.persistent_failures.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Persistent Failures ({comparison.persistent_failures.length})</span>
              </h4>
              <div className="divide-y divide-slate-800/80">
                {comparison.persistent_failures.map((item) => (
                  <div key={item.test_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-amber-400 font-semibold">{item.test_id}</span>
                      <span className="text-slate-200">{item.title}</span>
                      <span className="text-slate-500 text-[11px] hidden sm:inline">&bull; {item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(item.severity)}
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.outcome_run_a} / {item.outcome_run_b}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Runs Full Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Historical Evaluation Log</h3>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No historical runs found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Target Profile</th>
                  <th className="py-2.5 px-3 text-center">Total Tests</th>
                  <th className="py-2.5 px-3 text-center text-emerald-400">Passed</th>
                  <th className="py-2.5 px-3 text-center text-rose-400">Failed</th>
                  <th className="py-2.5 px-3">Detection Rate</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-slate-300">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{r.id.slice(0, 8)}...</td>
                    <td className="py-3 px-3 font-medium text-slate-200">{r.agent_name || 'Agent'}</td>
                    <td className="py-3 px-3 text-center font-mono">{r.total_tests}</td>
                    <td className="py-3 px-3 text-center text-emerald-400 font-mono font-medium">{r.passed_count}</td>
                    <td className="py-3 px-3 text-center text-rose-400 font-mono font-medium">{r.failed_count}</td>
                    <td className="py-3 px-3 font-mono text-indigo-300">
                      {r.detection_rate !== null && r.detection_rate !== undefined ? `${r.detection_rate}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{r.execution_duration_ms} ms</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => onNavigate('reports', r.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700"
                      >
                        Report
                      </button>
                      <button
                        onClick={() => onNavigate('findings', r.id)}
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
    </div>
  );
};
