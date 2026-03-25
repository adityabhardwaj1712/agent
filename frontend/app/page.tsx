'use client';

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { ToastProvider, useToast } from "./components/Toast";
import { apiFetch } from "./lib/api";

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
import AddAgentModal from "./components/AddAgentModal";
import AddTaskModal from "./components/AddTaskModal";

function AppContent() {
  const [activeView, setActiveView] = useState('agents');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [stats, setStats] = useState<any>({ active_events: 0, total_cost: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const handleAdded = () => {
    setRefreshKey(prev => prev + 1);
    const fetchGlobalStats = async () => {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        setStats(data);
      } catch (e) {}
    };
    fetchGlobalStats();
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const fetchGlobalStats = async () => {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        setStats(data);
      } catch (e) {}
    };
    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 20000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const getTitle = () => {
    switch (activeView) {
      case 'agents': return 'Agent Registry';
      case 'workflow': return 'Workflow Builder';
      case 'marketplace': return 'Marketplace';
      case 'analytics': return 'Analytics · 30 Days';
      case 'memory': return 'Memory Store';
      case 'settings': return 'Settings & Configuration';
      default: return 'AgentCloud Platform';
    }
  };

  const getSub = () => {
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
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: stats.pending_approvals > 0 ? 1 : 0.5 }}
              onClick={() => setActiveView('approvals')}
            >
              <div className={`ms-badge ${stats.pending_approvals > 0 ? 'ms-b-r' : 'ms-b-g'}`}>
                {stats.pending_approvals > 0 ? '⚠️' : '✅'} Approvals: {stats.pending_approvals}
              </div>
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: stats.active_events > 0 ? 1 : 0.5 }}
              onClick={() => setActiveView('traces')}
            >
              <div className="ms-badge ms-b-b">
                📡 Traces: {stats.active_events}
              </div>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--s-border)', margin: '0 8px' }}></div>
            
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

        {/* Main content */}
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
          onAdded={handleAdded}
        />
        <AddTaskModal 
          isOpen={isTaskModalOpen} 
          onClose={() => setIsTaskModalOpen(false)} 
          onAdded={handleAdded}
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
