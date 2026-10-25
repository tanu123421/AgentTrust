import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationRun } from '../types';

interface ReportsPageProps {
  initialRunId?: string;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ initialRunId, showToast }) => {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>(initialRunId || '');
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await api.getEvaluationRuns();
      setRuns(data);
      if (data.length > 0 && !selectedRunId) {
        setSelectedRunId(data[0].id);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load evaluation reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const selectedRun = runs.find((r) => r.id === selectedRunId);

  const handleDownloadJson = async () => {
    if (!selectedRunId) return;
    try {
      const res = await fetch(api.getJsonReportUrl(selectedRunId));
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AgentTrust-Report-${selectedRunId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', 'JSON report downloaded.');
    } catch (err: any) {
      showToast('error', 'Failed to download JSON report.');
    }
  };

  const handleOpenHtmlReport = () => {
    if (!selectedRunId) return;
    window.open(api.getHtmlReportUrl(selectedRunId), '_blank');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <span>Security & Compliance Evaluation Reports</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate print-ready standalone HTML reports and export structured JSON audit payloads for compliance records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Select Evaluation Run */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Select Evaluation Run</h3>

          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : runs.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">
              No evaluation runs available. Run an evaluation from the Security Lab to generate a report.
            </div>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {runs.map((r) => {
                const isSelected = r.id === selectedRunId;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRunId(r.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? 'bg-slate-950 border-indigo-500 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-indigo-400 font-bold">{r.id.slice(0, 8)}...</span>
                      <span className="text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="font-semibold text-slate-200">{r.agent_name || 'Agent Target'}</div>
                    <div className="flex items-center gap-3 text-[11px] mt-1.5 text-slate-400">
                      <span className="text-emerald-400 font-mono">{r.passed_count} Pass</span>
                      <span className="text-rose-400 font-mono">{r.failed_count} Fail</span>
                      <span>{r.execution_duration_ms} ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Report Actions & Preview */}
        <div className="lg:col-span-8 space-y-6">
          {selectedRun ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audit Ready Report</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">
                    {selectedRun.agent_name || 'Agent Target'} Security Evaluation
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Run ID: {selectedRun.id} &bull; {new Date(selectedRun.created_at).toUTCString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadJson}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>

                  <button
                    onClick={handleOpenHtmlReport}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View / Print HTML Report</span>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Total Tests</span>
                  <span className="text-xl font-bold font-mono text-slate-100 mt-1 block">
                    {selectedRun.total_tests}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-emerald-400 block font-semibold text-[10px] uppercase">Passed Tests</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    {selectedRun.passed_count}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-rose-400 block font-semibold text-[10px] uppercase">Failed Findings</span>
                  <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                    {selectedRun.failed_count}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-indigo-400 block font-semibold text-[10px] uppercase">Detection Rate</span>
                  <span className="text-xl font-bold font-mono text-indigo-300 mt-1 block">
                    {selectedRun.detection_rate !== null ? `${selectedRun.detection_rate}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* HTML Report Live Frame Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Standalone Report Live Preview</span>
                  <span className="text-slate-500 font-normal">Escapes untrusted HTML safely</span>
                </div>
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 h-96">
                  <iframe
                    src={api.getHtmlReportUrl(selectedRun.id)}
                    title="Report Preview"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Reporting Principles:</strong> Reports provide empirical evidence
                for the specific evaluated prompts, policies, and synthetic canary tests. Deterministic checks do not
                constitute a universal safety guarantee or formal compliance certification.
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-500">
              Select an evaluation run from the left to view summary metrics and download reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
