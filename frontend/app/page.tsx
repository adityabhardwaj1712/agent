'use client';

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { ToastProvider, useToast } from "./components/Toast";

// Views
import DashboardView from "./components/DashboardView";
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
import UnifiedDashboard from "./components/UnifiedDashboard";
import AddAgentModal from "./components/AddAgentModal";
import AddTaskModal from "./components/AddTaskModal";

function AppContent() {
  const [activeView, setActiveView] = useState('unified');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Fleet Overview';
      case 'agents': return 'Agent Registry';
      case 'workflow': return 'Workflow Builder';
      case 'marketplace': return 'Marketplace';
      case 'analytics': return 'Analytics · 30 Days';
      case 'memory': return 'Memory Store';
      case 'settings': return 'Settings & Configuration';
      case 'unified': return 'Unified Command Center';
      default: return 'AgentCloud Platform';
    }
  };

  const getSub = () => {
    if (activeView === 'dashboard') return 'Real-time agent orchestration dashboard';
    return '';
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
        {/* Topbar */}
        <header className="ms-topbar">
          <div>
            <div className="ms-topbar-title">{getTitle()}</div>
            <div style={{ fontSize: 11, color: 'var(--s-t3)' }}>{getSub()}</div>
          </div>
          
          <div className="ms-tb-right">
            {activeView === 'dashboard' && (
              <>
                <div className="ms-pill">
                  <span className="ms-dot ms-dot-g ms-dot-pulse"></span>
                  Live · 42 events
                </div>
                <div style={{ background: 'var(--s-bg3)', border: '1px solid var(--s-border)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: 'var(--s-t2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Search agents…
                </div>
                <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => setIsAgentModalOpen(true)}>+ New Agent</button>
                <button className="ms-btn ms-btn-b ms-btn-sm" onClick={() => setIsTaskModalOpen(true)}>+ New Task</button>
              </>
            )}
            {activeView === 'agents' && (
              <>
                <div className="ms-badge ms-b-b">PRO</div>
                <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => setIsAgentModalOpen(true)}>+ Register Agent</button>
              </>
            )}
            {activeView === 'tasks' && (
              <>
                <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => setIsTaskModalOpen(true)}>+ New Task</button>
              </>
            )}
          </div>
        </header>

        {/* Global Cost Ticker */}
        {activeView === 'dashboard' && (
          <div style={{ background: 'rgba(79,142,255,.06)', borderBottom: '1px solid var(--s-border)', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--s-blue)', fontFamily: 'var(--mono)' }}>⚡ Live Cost Ticker</div>
            <div style={{ fontSize: 11, color: 'var(--s-t2)' }}>
              Token Cost Today: <strong style={{ color: 'var(--s-amber)' }}>$2.47</strong> ↑
            </div>
            <div style={{ fontSize: 10, color: 'var(--s-t3)' }}>(updates 10s)</div>
          </div>
        )}

        {/* Main content */}
        {activeView === 'unified' && (
          <UnifiedDashboard 
            onOpenAgentModal={() => setIsAgentModalOpen(true)} 
            onOpenTaskModal={() => setIsTaskModalOpen(true)} 
          />
        )}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'agents' && <AgentGallery />}
        {activeView === 'tasks' && <TaskTable />}
        {activeView === 'workflow' && <WorkflowBuilder />}
        {activeView === 'memory' && <MemoryView />}
        {activeView === 'protocol' && <ProtocolView />}
        {activeView === 'traces' && <TracesView />}
        {activeView === 'approvals' && <ApprovalsView />}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'audit' && <AuditView />}
        {activeView === 'billing' && <BillingView />}
        
        <AddAgentModal 
          isOpen={isAgentModalOpen} 
          onClose={() => setIsAgentModalOpen(false)} 
          onAdded={() => { /* Potential refresh logic here if needed beyond local view refetch */ }}
        />
        <AddTaskModal 
          isOpen={isTaskModalOpen} 
          onClose={() => setIsTaskModalOpen(false)} 
          onAdded={() => {}}
        />
        
        {/* Marketplace & Settings placehoder */}
        {activeView === 'marketplace' && (
          <div className="ms-content">
             <div style={{ color: 'var(--s-t2)' }}>Agent Marketplace view coming soon.</div>
          </div>
        )}
        {activeView === 'settings' && (
          <div className="ms-content">
             <div className="ms-sg">
                <div className="ms-sg-title">API Credentials</div>
                <div className="ms-set-row"><span className="ms-sl">Anthropic Key</span><div style={{ fontSize: 11, color: 'var(--s-blue)', fontFamily: 'var(--mono)' }}>sk-ant-••••</div></div>
                <div className="ms-set-row"><span className="ms-sl">OpenAI Key</span><div style={{ fontSize: 11, color: 'var(--s-t3)', fontFamily: 'var(--mono)' }}>not set</div></div>
             </div>
             <div className="ms-sg">
                <div className="ms-sg-title">AXON Features</div>
                <div className="ms-set-row"><span className="ms-sl">Advanced Reasoning</span><div className="ms-toggle on"></div></div>
                <div className="ms-set-row"><span className="ms-sl">Circuit Breaker</span><div className="ms-toggle off"></div></div>
             </div>
          </div>
        )}
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
