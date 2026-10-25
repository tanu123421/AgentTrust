import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RotateCcw,
  CheckSquare,
  X,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { Finding } from '../types';

interface FindingsPageProps {
  initialRunId?: string;
  onNavigate: (tab: string, runId?: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({
  initialRunId,
  onNavigate,
  showToast
}) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [runIdFilter, setRunIdFilter] = useState<string>(initialRunId || '');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Finding for Details / Review
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>('UNDER_REVIEW');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const data = await api.getFindings({
        run_id: runIdFilter.trim() || undefined,
        severity: severityFilter || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery.trim() || undefined,
      });
      setFindings(data);
      if (selectedFinding) {
        const updated = data.find((f) => f.id === selectedFinding.id);
        if (updated) setSelectedFinding(updated);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch findings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [runIdFilter, severityFilter, categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFindings();
  };

  const openReviewModal = (finding: Finding) => {
    setSelectedFinding(finding);
    setReviewStatus(finding.status);
    setReviewNotes(finding.review_notes || '');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    if (!reviewNotes.trim()) {
      showToast('error', 'Please provide review justification notes.');
      return;
    }

    setUpdating(true);
    try {
      const updated = await api.updateFindingStatus(
        selectedFinding.id,
        reviewStatus,
        reviewNotes.trim()
      );
      showToast('success', `Finding status updated to '${reviewStatus}'.`);
      setSelectedFinding(updated);
      setIsReviewModalOpen(false);
      fetchFindings();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update review status.');
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
      HIGH: 'text-orange-400 bg-orange-950/60 border-orange-800/60',
      MEDIUM: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      LOW: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
      INFO: 'text-slate-400 bg-slate-900 border-slate-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${colors[sev] || colors.LOW}`}>
        {sev}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
      UNDER_REVIEW: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
      ACCEPTED_RISK: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
      MITIGATED: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${styles[status] || styles.OPEN}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <span>Security Findings Explorer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit detected vulnerabilities, inspect masked canary evidence, and track remediation workflows.
          </p>
        </div>

        {runIdFilter && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-950/60 border border-indigo-800/60 rounded-lg text-xs text-indigo-200">
            <span>Filtered by Run: <code className="font-mono text-indigo-300">{runIdFilter.slice(0, 8)}...</code></span>
            <button
              onClick={() => setRunIdFilter('')}
              className="text-indigo-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Rule ID or finding title..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Review Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACCEPTED_RISK">Accepted Risk</option>
              <option value="MITIGATED">Mitigated</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* Findings Content: Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Column */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : findings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
              No findings match your filter criteria.
            </div>
          ) : (
            findings.map((f) => {
              const isSelected = selectedFinding?.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFinding(f)}
                  className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-slate-900 shadow-md shadow-indigo-950/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(f.severity)}
                      <span className="font-mono text-[11px] text-slate-400">{f.test_id}</span>
                    </div>
                    {getStatusBadge(f.status)}
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{f.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {f.explanation}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{f.category}</span>
                    <span>{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Column */}
        <div className="lg:col-span-7">
          {selectedFinding ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 sticky top-8">
              {/* Finding Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {getSeverityBadge(selectedFinding.severity)}
                    <span className="font-mono text-xs text-indigo-400">{selectedFinding.rule_id}</span>
                    <span className="text-xs text-slate-500">&bull;</span>
                    <span className="text-xs text-slate-400">{selectedFinding.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{selectedFinding.title}</h3>
                </div>

                <button
                  onClick={() => openReviewModal(selectedFinding)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Update Status</span>
                </button>
              </div>

              {/* Status & Review Notes Section */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Current Review Status: </span>
                  {getStatusBadge(selectedFinding.status)}
                </div>
                {selectedFinding.review_notes && (
                  <div className="text-[11px] text-slate-300 italic max-w-xs truncate">
                    &ldquo;{selectedFinding.review_notes}&rdquo;
                  </div>
                )}
              </div>

              {/* Masked Evidence Box */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Observed Evidence (Canary & PII Masked)
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
                  {selectedFinding.evidence_masked}
                </div>
              </div>

              {/* Expected vs Observed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                  <span className="text-slate-400 font-semibold block mb-1">Expected Secure Behavior</span>
                  <p className="text-slate-200 leading-relaxed">{selectedFinding.expected_behavior}</p>
                </div>
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                  <span className="text-slate-400 font-semibold block mb-1">Observed Behavior</span>
                  <p className="text-slate-200 leading-relaxed">{selectedFinding.observed_behavior}</p>
                </div>
              </div>

              {/* Remediation Box */}
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs space-y-1">
                <span className="text-emerald-400 font-bold block">Recommended Remediation Guidance</span>
                <p className="text-emerald-200/90 leading-relaxed">{selectedFinding.recommended_mitigation}</p>
              </div>

              {/* Limitations Note */}
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <strong>Detection Limitations:</strong> {selectedFinding.limitations_note}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-500">
              Select a finding from the left to inspect masked evidence, observed behaviors, and remediation steps.
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Review Finding Workflow</h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Update Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPEN">Open (Active Unresolved Finding)</option>
                  <option value="UNDER_REVIEW">Under Review (Investigation In Progress)</option>
                  <option value="ACCEPTED_RISK">Accepted Risk (Business Justification)</option>
                  <option value="MITIGATED">Mitigated (Remediated in Configuration)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Review Notes & Justification *</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain why this status is assigned (e.g., 'Compensating controls added at API gateway' or 'Under triage by security team')..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                >
                  {updating ? 'Saving...' : 'Save Review Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
