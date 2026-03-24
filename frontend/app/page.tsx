'use client';

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { apiJson } from "./lib/api";
import { RefreshCw, Plus } from "lucide-react";

// Components for the Pro UI
import DashboardView from "./components/DashboardView";
import AgentGallery from "./components/AgentGallery";
import TaskTable from "./components/TaskTable";
import WorkflowBuilder from "./components/WorkflowBuilder";

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && window.location.pathname !== "/landing") {
      window.location.href = "/landing";
    } else {
      setLoading(false);
      // Set initial theme
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (loading) return null;

  const PAGE_META: Record<string, [string, string]> = {
    dashboard: ['Fleet Dashboard', 'Real-time orchestration overview'],
    agents: ['Agents', 'Manage your AI agent fleet'],
    tasks: ['Tasks', 'Submit, monitor & stream task execution'],
    workflow: ['Workflow Builder', 'Design & run multi-agent pipelines'],
    memory: ['Memory', 'Agent memory & vector embeddings'],
    protocol: ['Protocol', 'Agent-to-agent message bus'],
    traces: ['Execution Traces', 'Full observability & flame graphs'],
    approvals: ['Approvals', 'Human-in-the-loop checkpoints'],
    analytics: ['Analytics', 'Performance metrics & cost insights'],
    audit: ['Audit Logs', 'Full system activity trail'],
    billing: ['Billing', 'Usage tracking & cost management'],
  };

  const [title, sub] = PAGE_META[activeView] || [activeView, ''];

  return (
    <div className="ac-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar Component */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        onRegisterAgent={() => setActiveView('agents')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="main flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOPBAR */}
        <header className="topbar">
          <div className="page-info">
            <div className="page-title">{title}</div>
            <div className="page-sub">{sub}</div>
          </div>
          
          <div className="topbar-right">
            <div className="pill">
              <span className="dot dot-g dot-pulse"></span>
              All Systems Operational
            </div>
            <div className="pill">
              <span className="dot dot-y"></span>
              API: Demo Mode
            </div>
            <button className="btn btn-g btn-sm flex items-center gap-2">
              <RefreshCw size={12} /> Refresh
            </button>
            <button className="btn btn-p btn-sm flex items-center gap-2" onClick={() => setActiveView('tasks')}>
              <Plus size={12} /> Submit Task
            </button>
          </div>
        </header>

        {/* View Switcher */}
        <div className="view-container flex-1 overflow-y-auto">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'agents' && <AgentGallery />}
          {activeView === 'tasks' && <TaskTable />}
          {activeView === 'workflow' && <WorkflowBuilder />}
          
          {/* Placeholder for other views */}
          {!['dashboard', 'agents', 'tasks', 'workflow'].includes(activeView) && (
            <div className="view-body p-8 flex items-center justify-center text-t3 mono">
              Section [{activeView.toUpperCase()}] connectivity in progress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

