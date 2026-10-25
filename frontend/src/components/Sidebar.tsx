import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  FlaskConical,
  ShieldAlert,
  KeyRound,
  History,
  FileText,
  Settings,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openFindingsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openFindingsCount = 0
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'profiles', label: 'Agent Profiles', icon: Bot },
    { id: 'lab', label: 'Security Lab', icon: FlaskConical },
    { id: 'findings', label: 'Findings Explorer', icon: ShieldAlert, badge: openFindingsCount > 0 ? openFindingsCount : undefined },
    { id: 'simulator', label: 'Tool Simulator', icon: KeyRound },
    { id: 'history', label: 'Runs & Compare', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings & Docs', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
        <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-slate-100 tracking-tight text-base leading-none">AgentTrust</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">v1.0 Local Edition</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Platform Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-indigo-900 text-indigo-200' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/60">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-medium text-slate-300">Local Engine Active</span>
        </div>
        <div>Offline Deterministic Mode &bull; 32 Rules</div>
      </div>
    </aside>
  );
};
