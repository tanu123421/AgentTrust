import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';

import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AgentProfilesPage } from './pages/AgentProfilesPage';
import { SecurityLabPage } from './pages/SecurityLabPage';
import { FindingsPage } from './pages/FindingsPage';
import { ToolSimulatorPage } from './pages/ToolSimulatorPage';
import { HistoryComparePage } from './pages/HistoryComparePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeContextId, setActiveContextId] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [openFindingsCount, setOpenFindingsCount] = useState<number>(0);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (tab: string, contextId?: string) => {
    setCurrentTab(tab);
    setActiveContextId(contextId);
  };

  const refreshFindingsBadge = async () => {
    try {
      const openFindings = await api.getFindings({ status: 'OPEN' });
      setOpenFindingsCount(openFindings.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshFindingsBadge();
    const interval = setInterval(refreshFindingsBadge, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => handleNavigate(tab)}
        openFindingsCount={openFindingsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header currentTab={currentTab} />

        {/* Scrollable View */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} showToast={showToast} />
          )}
          {currentTab === 'projects' && (
            <ProjectsPage onNavigate={handleNavigate} showToast={showToast} />
          )}
          {currentTab === 'profiles' && (
            <AgentProfilesPage
              initialProjectId={activeContextId}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}
          {currentTab === 'lab' && (
            <SecurityLabPage
              initialProfileId={activeContextId}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}
          {currentTab === 'findings' && (
            <FindingsPage
              initialRunId={activeContextId}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}
          {currentTab === 'simulator' && (
            <ToolSimulatorPage showToast={showToast} />
          )}
          {currentTab === 'history' && (
            <HistoryComparePage onNavigate={handleNavigate} showToast={showToast} />
          )}
          {currentTab === 'reports' && (
            <ReportsPage initialRunId={activeContextId} showToast={showToast} />
          )}
          {currentTab === 'settings' && (
            <SettingsPage showToast={showToast} />
          )}
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
