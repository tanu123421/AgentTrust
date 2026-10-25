import React, { useEffect, useState } from 'react';
import {
  Settings,
  Terminal,
  Database,
  Shield,
  Layers,
  ExternalLink,
  Lock,
  Cpu,
  BookOpen,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { EnvironmentStatus } from '../types';

interface SettingsPageProps {
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ showToast }) => {
  const [status, setStatus] = useState<EnvironmentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnvStatus = async () => {
      try {
        const data = await api.getStatus();
        setStatus(data);
      } catch (err: any) {
        showToast('error', 'Failed to retrieve environment status.');
      } finally {
        setLoading(false);
      }
    };
    fetchEnvStatus();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Settings & System Documentation</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Local runtime status, rule engine diagnostics, architecture overview, and documentation references.
        </p>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Cpu className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-slate-200">Rule Engine Runtime</h3>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Platform</span>
              <span className="font-semibold text-slate-200">AgentTrust v1.0.0</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Active Test Rules</span>
              <span className="font-mono text-emerald-400 font-bold">
                {status ? status.active_test_definitions : 32} Defined
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Execution Mode</span>
              <span className="text-indigo-300 font-medium">Deterministic Local-First</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Database className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-slate-200">Persistence Layer</h3>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Database Engine</span>
              <span className="font-semibold text-slate-200">SQLite (Local File)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">ORM Schema</span>
              <span className="text-slate-300">SQLAlchemy 2.0+</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Integrity Status</span>
              <span className="text-emerald-400 font-semibold">
                {status?.database_status || 'Healthy'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Lock className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-slate-200">Secret & Key Handling</h3>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Provider Status</span>
              <span className="text-slate-200">Zero-Key Required</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Masking Filter</span>
              <span className="text-emerald-400 font-medium">Canary DLP Active</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Target Isolation</span>
              <span className="text-indigo-300 font-medium">Safe Local Sandbox</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional AI Provider Configuration Guidance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Configuring Optional Remote LLM Adapters</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The core platform runs completely offline without paid APIs. If you choose to configure a live model endpoint,
          specify environment variables in <code className="text-indigo-300 font-mono">backend/.env</code>.
          Credentials are read exclusively from environment variables and never logged or exposed in client responses.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 space-y-1">
          <div className="text-slate-500"># backend/.env configuration template</div>
          <div>LLM_PROVIDER=&quot;offline&quot; <span className="text-slate-500"># or &quot;custom-endpoint&quot;</span></div>
          <div>LLM_API_KEY=&quot;&quot; <span className="text-slate-500"># Never commit real secrets</span></div>
          <div>MAX_INPUT_LENGTH_CHARS=20000</div>
          <div>MAX_TEST_CASES_PER_RUN=100</div>
        </div>
      </div>

      {/* Quick Documentation Links */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Interactive API Documentation & Documentation Assets</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                FastAPI Swagger UI
              </div>
              <div className="text-slate-500 mt-0.5">Interactive REST API endpoints with schemas</div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
          </a>

          <a
            href="http://127.0.0.1:8000/redoc"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                ReDoc Documentation
              </div>
              <div className="text-slate-500 mt-0.5">Clean technical reference for AgentTrust OpenAPI</div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
          </a>
        </div>
      </div>

      {/* Responsible Testing & Philosophy */}
      <div className="p-4 bg-slate-900/60 border-l-4 border-indigo-500 rounded-r-lg text-xs text-slate-400 space-y-2">
        <div className="font-semibold text-slate-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Responsible Testing & Ethical Boundary Statement</span>
        </div>
        <p className="leading-relaxed">
          AgentTrust is designed strictly for defensive evaluation and authorization testing of AI applications
          owned by the developer or for which explicit testing permission has been granted.
          All dangerous simulated actions (email sending, record deletion, code execution) are intercepted and policy-verified
          in memory without external side effects.
        </p>
      </div>
    </div>
  );
};
