import React from 'react';
import { ExternalLink, Terminal, Shield } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onQuickAction?: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Security Posture Overview', subtitle: 'Empirical AI risk metrics, recent evaluation runs, and severity distribution' },
  projects: { title: 'Evaluation Projects', subtitle: 'Manage target AI applications, agents, and target boundaries' },
  profiles: { title: 'Agent Profiles & Policies', subtitle: 'Configure target agent credentials, tool scopes, and sensitivity levels' },
  lab: { title: 'Security Evaluation Lab', subtitle: 'Execute comprehensive vulnerability test suites against target profiles' },
  findings: { title: 'Security Findings Explorer', subtitle: 'Investigate masked evidence, audit policy violations, and track remediation' },
  simulator: { title: 'Tool Permission Simulator', subtitle: 'Test server-side tool authorization, least-privilege enforcement, and human approval gates' },
  history: { title: 'Evaluation Runs & Regression Compare', subtitle: 'Compare consecutive evaluation runs to identify new failures and verify fixes' },
  reports: { title: 'Compliance & Audit Reports', subtitle: 'Export standalone HTML security reports and structured JSON audit payloads' },
  settings: { title: 'Environment & Documentation', subtitle: 'System diagnostics, local configuration, threat model, and API documentation' },
};

export const Header: React.FC<HeaderProps> = ({ currentTab, onQuickAction }) => {
  const current = TAB_TITLES[currentTab] || { title: 'AgentTrust', subtitle: 'AI Agent Security Evaluation' };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-bold text-slate-100 leading-tight">{current.title}</h1>
        <p className="text-xs text-slate-400">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>127.0.0.1:8000</span>
          <span className="text-slate-500">|</span>
          <span className="text-indigo-400">Zero-API-Key</span>
        </div>

        {/* Quick API Docs Button */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          title="Open FastAPI Swagger Interactive Docs"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>API Docs</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Responsible Testing Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/60 border border-indigo-800/60 rounded-lg text-xs text-indigo-300">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Authorized Testing Only</span>
        </div>
      </div>
    </header>
  );
};
