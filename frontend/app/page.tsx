'use client';

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import { ToastProvider, useToast } from "./components/Toast";
import { apiFetch, getToken } from "./lib/api";

// Views
import AgentGallery from "./components/AgentGallery";
import TaskTable from "./components/TaskTable";
import WorkflowBuilder from "./components/WorkflowBuilder";
import MemoryView from "./components/MemoryView";
import ProtocolView from "./components/ProtocolView";
import TracesView from "./components/TracesView";
import ApprovalsView from "./components/ApprovalsView";
import AnalyticsView from "./components/AnalyticsView";
import AuditView from "./components/AuditView";
import BillingView from "./components/BillingView";
import MarketplaceView from "./components/MarketplaceView";
import SettingsView from "./components/SettingsView";
import AddAgentModal from "./components/AddAgentModal";
import AddTaskModal from "./components/AddTaskModal";
import AutonomousView from "./components/AutonomousView";
import AgentPlayground from "./components/AgentPlayground";
import ProDashboard from "./components/ProDashboard";
import CopilotChat from "./components/CopilotChat";
import KnowledgeHub from "./components/KnowledgeHub";

// Live ticker items that rotate
const TICKER_TEMPLATES = [
  { color: '#f59e0b', text: 'Worker CPU monitoring active' },
  { color: '#00f5d4', text: 'Agent sync in progress' },
  { color: '#00b4f0', text: 'API health: nominal' },
  { color: '#8b5cf6', text: 'Workflow engine ready' },
  { color: '#00f5d4', text: 'Auto-scale standby' },
  { color: '#ef4444', text: 'Memory threshold monitoring' },
  { color: '#00b4f0', text: 'Task queue processing' },
];

function LiveTicker({ stats }: { stats: any }) {
  const [tickerItems, setTickerItems] = useState<Array<{ color: string; text: string }>>([]);

  useEffect(() => {
    // Build dynamic ticker from real stats + templates
    const items: Array<{ color: string; text: string }> = [];

    if (stats.active_agents !== undefined) {
      items.push({ color: '#00b4f0', text: `${stats.active_agents} agents online` });
    }
    if (stats.active_events !== undefined) {
      items.push({ color: '#00f5d4', text: `${stats.active_events} active events` });
    }
    if (stats.total_cost !== undefined) {
      items.push({ color: '#f59e0b', text: `Credits used: $${stats.total_cost?.toFixed(4) || '0.0000'}` });
    }
    if (stats.tasks_completed !== undefined) {
      items.push({ color: '#00f5d4', text: `${stats.tasks_completed} tasks completed` });
    }

    // Pad with templates to ensure animation looks good
    const all = [...items, ...TICKER_TEMPLATES];
    // Duplicate for seamless scroll
    setTickerItems([...all, ...all]);
  }, [stats]);

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {tickerItems.map((item, i) => (
          <span key={i} className="tick-item">
            <span className="tick-dot" style={{ background: item.color }} />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const [activeView, setActiveView] = useState('fleet');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [stats, setStats] = useState<any>({ active_events: 0, total_cost: 0, active_agents: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [clock, setClock] = useState('--:--:--');

  const handleAdded = () => {
    setRefreshKey(prev => prev + 1);
    fetchGlobalStats();
  };

  const fetchGlobalStats = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await apiFetch<any>('/analytics/summary');
      if (data) setStats((prev: any) => ({ ...prev, ...data }));
    } catch (e) {
      console.error("Stats fetch failed", e);
    }
  }, []);

  useEffect(() => {
    (window as any).openAddAgent = () => setIsAgentModalOpen(true);
    (window as any).openAddTask = () => setIsTaskModalOpen(true);

    document.documentElement.setAttribute('data-theme', 'dark');
    fetchGlobalStats();
    const statsInterval = setInterval(fetchGlobalStats, 20000);

    // Clock
    const clockInterval = setInterval(() => {
      setClock(new Date().toTimeString().split(' ')[0]);
    }, 1000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(clockInterval);
    };
  }, [fetchGlobalStats]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="ms">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="ms-body">
        {/* Topbar with live ticker */}
        <header className="ms-topbar">
          <LiveTicker stats={stats} />

          <div className="ms-tb-right">
            <div className="opt-badge">
              <div className="sys-dot" style={{ width: 5, height: 5 }} />
              {stats.active_events > 10 ? 'High Load' : 'Optimal'}
            </div>

            <div className="icon-btn" onClick={fetchGlobalStats} title="Refresh">↺</div>
            <div className="icon-btn" title="Notifications">🔔</div>

            <div className="avatar">
              {typeof window !== 'undefined' ? 'A' : '?'}
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="content">
          {activeView === 'fleet' && <ProDashboard />}
          {activeView === 'agents' && <AgentGallery />}
          {activeView === 'tasks' && <TaskTable />}
          {activeView === 'workflow' && <WorkflowBuilder />}
          {activeView === 'memory' && <MemoryView refreshKey={refreshKey} />}
          {activeView === 'protocol' && <ProtocolView />}
          {activeView === 'traces' && <TracesView />}
          {activeView === 'approvals' && <ApprovalsView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'audit' && <AuditView />}
          {activeView === 'billing' && <BillingView />}
          {activeView === 'marketplace' && <MarketplaceView />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'autonomous' && <AutonomousView />}
          {activeView === 'playground' && <AgentPlayground />}
          {activeView === 'knowledge' && <KnowledgeHub />}

          <AddAgentModal 
            isOpen={isAgentModalOpen} 
            onClose={() => setIsAgentModalOpen(false)} 
            onAdded={handleAdded}
          />
          <AddTaskModal 
            isOpen={isTaskModalOpen} 
            onClose={() => setIsTaskModalOpen(false)} 
            onAdded={handleAdded}
          />
        </div>

        {/* Global Copilot Chat Overlay */}
        <CopilotChat />
      </div>
    </div>
  );
}


export default function Home() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
