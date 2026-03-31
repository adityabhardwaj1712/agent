'use client';

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Cpu, 
  Shield, 
  Zap, 
  Clock, 
  Search, 
  Bell, 
  User,
  LayoutDashboard,
  Box,
  Compass,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
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

import { MetricCard, IncidentFeed, DashboardAgentList, ConfigraphWidget } from "./components/DashboardWidgets";
import FleetDashboard from "./components/FleetDashboard";
import ProDashboard from "./components/ProDashboard";
import CopilotChat from "./components/CopilotChat";
import KnowledgeHub from "./components/KnowledgeHub";

function AppContent() {
  const [activeView, setActiveView] = useState('fleet');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [stats, setStats] = useState<any>({ active_events: 0, total_cost: 0, active_agents: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const handleAdded = () => {
    setRefreshKey(prev => prev + 1);
    fetchGlobalStats();
  };

  const fetchGlobalStats = async () => {
    if (!getToken()) return;
    try {
      const data = await apiFetch<any>('/analytics/summary');
      if (data) setStats((prev: any) => ({ ...prev, ...data }));
    } catch (e) {
      console.error("Stats fetch failed", e);
    }
  };

  useEffect(() => {
    (window as any).openAddAgent = () => setIsAgentModalOpen(true);
    (window as any).openAddTask = () => setIsTaskModalOpen(true);
    
    document.documentElement.setAttribute('data-theme', 'dark');
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
      case 'fleet': return 'COMMAND_DASHBOARD';
      case 'agents': return 'AGENT_REGISTRY';
      case 'workflow': return 'LOGIC_ORCHESTRATOR';
      case 'marketplace': return 'FLEET_MARKETPLACE';
      case 'analytics': return 'KPI_ANALYTICS';
      case 'memory': return 'NEURAL_MEMORY_STORE';
      case 'autonomous': return 'MISSION_CONTROL';
      case 'playground': return 'AGENT_EXPERIMENT_LAB';
      case 'settings': return 'SYSTEM_CONFIGURATION';
      case 'approvals': return 'GUARDRAIL_PROTOCOL';
      case 'audit': return 'SECURITY_AUDIT_LOG';
      case 'billing': return 'RESOURCE_REVENUE';
      case 'protocol': return 'COMMUNICATION_MESH';
      case 'traces': return 'OBSERVABILITY_SURFACE';
      case 'knowledge': return 'RAG_KNOWLEDGE_HUB';
      default: return 'AGENT_CLOUD_OS';
    }
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
          <div className="ms-topbar-title">{getTitle()}</div>
          
          <div className="ms-tb-right">
            <div className="ms-pill bg-[rgba(34,211,238,0.05)] border border-[rgba(34,211,238,0.1)]">
              <div className={`ms-dot ms-dot-${stats.active_events > 5 ? 'y' : 'g'} animate-pulse`}></div>
              <span className="text-[10px] font-mono text-[var(--t3)] mr-2">SYS_LOAD:</span>
              <span style={{ color: stats.active_events > 5 ? 'var(--amber)' : 'var(--green)', fontWeight: 800, fontSize: '10px' }}>
                {stats.active_events > 10 ? 'HIGH' : stats.active_events > 5 ? 'MODERATE' : 'NOMINAL'}
              </span>
            </div>

            <div className="ms-pill bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.1)]">
              <span className="text-[10px] font-mono text-[var(--t3)] mr-2 text-amber-500">CREDITS:</span>
              <span style={{ color: 'var(--amber)', fontWeight: 800, fontSize: '10px' }}>${stats.total_cost?.toFixed(4) || '0.0000'}</span>
            </div>

            <div className="flex items-center gap-2 ml-4">
               <button className="ms-btn-icon-sm" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px' }} onClick={fetchGlobalStats}><RefreshCw size={14} /></button>
               <button className="ms-btn-icon-sm" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px' }}><Bell size={14} /></button>
               <div className="h-4 w-[1px] bg-[var(--bg3)] mx-2"></div>
               <div className="ms-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>AD</div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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

