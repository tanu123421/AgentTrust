import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Project, AgentProfile, EvaluationRun } from '../types';

interface SecurityLabPageProps {
  initialProfileId?: string;
  onNavigate: (tab: string, runId?: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SecurityLabPage: React.FC<SecurityLabPageProps> = ({
  initialProfileId,
  onNavigate,
  showToast
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfileId || '');

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Custom Prompt / Response mode
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [customResponse, setCustomResponse] = useState<string>('');

  // Execution State
  const [running, setRunning] = useState<boolean>(false);
  const [lastRunResult, setLastRunResult] = useState<EvaluationRun | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [projData, testData] = await Promise.all([
          api.getProjects(),
          api.getTestCases(),
        ]);
        setProjects(projData);
        setCategories(testData.categories);
        setTestCases(testData.test_cases);

        if (projData.length > 0) {
          const firstProjId = projData[0].id;
          setSelectedProjectId(firstProjId);
          const profData = await api.getProjectProfiles(firstProjId);
          setProfiles(profData);
          if (profData.length > 0) {
            setSelectedProfileId(profData[0].id);
          }
        }
      } catch (err: any) {
        showToast('error', err.message || 'Failed to load test lab configuration.');
      }
    };
    init();
  }, []);

  const handleProjectChange = async (projId: string) => {
    setSelectedProjectId(projId);
    try {
      const profData = await api.getProjectProfiles(projId);
      setProfiles(profData);
      if (profData.length > 0) {
        setSelectedProfileId(profData[0].id);
      } else {
        setSelectedProfileId('');
      }
    } catch (err: any) {
      showToast('error', 'Error loading project agent profiles.');
    }
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const selectAllCategories = () => {
    setSelectedCategories([]);
  };

  const filteredTestCases = testCases.filter((tc) => {
    if (selectedCategories.length === 0) return true;
    return selectedCategories.includes(tc.category);
  });

  const handleExecuteEvaluation = async () => {
    if (!selectedProjectId || !selectedProfileId) {
      showToast('error', 'Please select both a project and an agent profile.');
      return;
    }

    setRunning(true);
    setLastRunResult(null);

    try {
      const payload: any = {
        project_id: selectedProjectId,
        agent_profile_id: selectedProfileId,
        category_filter: selectedCategories.length > 0 ? selectedCategories : undefined,
        notes: `Lab evaluation run (${selectedCategories.length > 0 ? selectedCategories.join(', ') : 'All 10 Categories'})`,
      };

      if (customMode) {
        payload.custom_prompt = customPrompt.trim() || undefined;
        payload.simulated_agent_response = customResponse.trim() || undefined;
      }

      const run = await api.runEvaluation(payload);
      setLastRunResult(run);
      showToast('success', `Evaluation completed: ${run.passed_count} Passed, ${run.failed_count} Failed.`);
    } catch (err: any) {
      showToast('error', err.message || 'Evaluation run execution failed.');
    } finally {
      setRunning(false);
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <span>Security Evaluation Lab</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure parameters, select test suites, and execute deterministic security evaluation scans.
          </p>
        </div>

        <button
          onClick={handleExecuteEvaluation}
          disabled={running || !selectedProfileId}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-sm shadow-indigo-600/30 transition-colors"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Executing Evaluation Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Execute Evaluation Suite ({filteredTestCases.length} Tests)</span>
            </>
          )}
        </button>
      </div>

      {/* Target Setup Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">1. Target Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Target Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Agent Profile to Test</label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {profiles.length === 0 ? (
                <option value="">No profiles in this project</option>
              ) : (
                profiles.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name} ({pr.sensitivity_level} &bull; {pr.model_provider})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">2. Security Categories</h3>
          <button
            onClick={selectAllCategories}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {selectedCategories.length === 0 ? 'All 10 Categories Active' : 'Reset to All Categories'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategories.length === 0 || selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600/30 border border-indigo-500 text-indigo-200 shadow-xs'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">3. Custom Prompt & Simulated Response (Optional)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supply custom input to evaluate an unlisted prompt or candidate response against deterministic rules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCustomMode(!customMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              customMode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {customMode ? 'Custom Mode Enabled' : 'Enable Custom Input'}
          </button>
        </div>

        {customMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Custom Input Scenario</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter prompt scenario or injection probe..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Simulated Agent Response</label>
              <textarea
                value={customResponse}
                onChange={(e) => setCustomResponse(e.target.value)}
                placeholder="Enter candidate agent completion to evaluate..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Post-Run Result Card */}
      {lastRunResult && (
        <div className="bg-slate-900 border-2 border-indigo-600/60 rounded-xl p-6 space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase text-indigo-400 tracking-wider">Evaluation Completed</span>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">Run ID: {lastRunResult.id}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('findings', lastRunResult.id)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Explore Findings ({lastRunResult.failed_count})</span>
              </button>
              <button
                onClick={() => onNavigate('reports', lastRunResult.id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Full Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg text-center border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Tests</div>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">{lastRunResult.total_tests}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg text-center border border-slate-800">
              <div className="text-[11px] text-emerald-400 uppercase font-semibold">Passed</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{lastRunResult.passed_count}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg text-center border border-slate-800">
              <div className="text-[11px] text-rose-400 uppercase font-semibold">Failed</div>
              <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{lastRunResult.failed_count}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg text-center border border-slate-800">
              <div className="text-[11px] text-indigo-400 uppercase font-semibold">Detection Rate</div>
              <div className="text-xl font-bold text-indigo-300 mt-1 font-mono">
                {lastRunResult.detection_rate !== null ? `${lastRunResult.detection_rate}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg text-center border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Execution Time</div>
              <div className="text-xl font-bold text-slate-300 mt-1 font-mono">{lastRunResult.execution_duration_ms} ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Test Scenarios Preview List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            4. Test Scenario Catalog ({filteredTestCases.length} Scenarios)
          </h3>
          <span className="text-xs text-slate-400">Click any row to inspect expected behavior & limitations</span>
        </div>

        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden">
          {filteredTestCases.map((tc) => {
            const isExpanded = expandedTestId === tc.test_id;
            return (
              <div key={tc.test_id} className="bg-slate-950/40 hover:bg-slate-900/60 transition-colors">
                <button
                  onClick={() => setExpandedTestId(isExpanded ? null : tc.test_id)}
                  className="w-full text-left p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="font-mono text-indigo-400 font-bold">{tc.test_id}</span>
                    <span className="font-medium text-slate-200">{tc.name}</span>
                    {tc.is_benign_control && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Benign Control
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">{tc.category}</span>
                    {getSeverityBadge(tc.severity)}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-3 text-xs">
                    <p className="text-slate-300 leading-relaxed">{tc.description}</p>
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-300">
                      <span className="text-slate-500 uppercase font-semibold block mb-1">Input Scenario:</span>
                      {tc.input_scenario}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
                      <div>
                        <strong className="text-slate-300 block mb-0.5">Expected Behavior:</strong>
                        <p>{tc.expected_behavior}</p>
                      </div>
                      <div>
                        <strong className="text-slate-300 block mb-0.5">Remediation Guidance:</strong>
                        <p>{tc.remediation_guidance}</p>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <em>Limitations Note:</em> {tc.limitations}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
