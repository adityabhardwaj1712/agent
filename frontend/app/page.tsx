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
  const [activeView, setActiveView] = useState('fleet');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [stats, setStats] = useState<any>({ active_events: 0, total_cost: 2.47, active_agents: 46 });
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
        if (data) setStats((prev: any) => ({ ...prev, ...data }));
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
      case 'fleet': return 'Fleet Overview';
      case 'agents': return 'Agent Registry';
      case 'workflow': return 'Workflow Builder';
      case 'marketplace': return 'Marketplace';
      case 'analytics': return 'Analytics';
      case 'memory': return 'Memory Store';
      case 'settings': return 'Settings & Configuration';
      default: return 'AgentCloud Platform';
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
            <div className="ms-pill">
              <div className="ms-dot ms-dot-g ms-dot-pulse"></div>
              Live Cost: <span style={{ color: 'var(--amber)', fontWeight: 700, marginLeft: 4 }}>${stats.total_cost || '0.00'}</span>
              <span style={{ color: 'var(--t3)', marginLeft: 4 }}>today</span>
            </div>

            <div 
              style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => setActiveView('traces')}
            >
              <div className="ms-badge ms-b-b">
                 Traces: {stats.active_events || 0}
              </div>
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }}></div>
            
            <div className="ms-avatar" style={{ cursor: 'pointer' }}>AK</div>
          </div>
        </header>

        {/* Main content */}
        {activeView === 'fleet' && (
          <div className="ms-content">
            <div className="ms-kpi-grid">
               <div className="ms-kpi" style={{ '--kc': 'var(--blue)' } as any}>
                  <div className="ms-kpi-lbl">Active Agents</div>
                  <div className="ms-kpi-val">{stats.active_agents || 0}</div>
                  <div className="ms-kpi-delta ms-up">↑ 4 since yesterday</div>
               </div>
               <div className="ms-kpi" style={{ '--kc': 'var(--green)' } as any}>
                  <div className="ms-kpi-lbl">Total Tasks · 24h</div>
                  <div className="ms-kpi-val">1.26k</div>
                  <div className="ms-kpi-delta ms-up">↑ 12% vs avg</div>
               </div>
               <div className="ms-kpi" style={{ '--kc': 'var(--amber)' } as any}>
                  <div className="ms-kpi-lbl">Success Rate</div>
                  <div className="ms-kpi-val">94%</div>
                  <div className="ms-kpi-delta ms-dn">↓ 2% circuit events</div>
               </div>
               <div className="ms-kpi" style={{ '--kc': 'var(--cyan)' } as any}>
                  <div className="ms-kpi-lbl">Avg Latency</div>
                  <div className="ms-kpi-val">10ms</div>
                  <div className="ms-kpi-delta ms-up">↑ 3ms P99 stable</div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
               <div className="ms-card">
                  <div className="ms-card-hd">
                     <div className="ms-card-title">Live Agent Collaboration</div>
                     <div className="ms-badge ms-b-g"><div className="ms-dot ms-dot-g ms-dot-pulse" style={{ width: 6, height: 6 }}></div>Real-time</div>
                  </div>
                  <div className="ms-card-body" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg1)', position: 'relative' }}>
                      <div style={{ color: 'var(--t3)', fontSize: 11, textAlign: 'center' }}>
                         [ Interactive ACP Graph Canvas ]<br/>
                         Linking {stats.active_agents} agents via Protocol Mesh
                      </div>
                  </div>
               </div>
               <div className="ms-card">
                  <div className="ms-card-hd">
                     <div className="ms-card-title">Incident Timeline</div>
                     <span className="ms-badge">src-94</span>
                  </div>
                  <div className="ms-card-body">
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { t: '14:32', m: 'Agent cost spiked 5x — Research Agent', s: 'warn' },
                          { t: '14:33', m: 'Circuit breaker triggered — Data Analyst', s: 'err' },
                          { t: '14:35', m: 'P99 Latency stabilized at 12ms', s: 'ok' }
                        ].map((inc, i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, fontSize: 11, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                             <span style={{ color: inc.s === 'err' ? 'var(--red)' : inc.s === 'warn' ? 'var(--amber)' : 'var(--green)' }}>{inc.s === 'err' ? '●' : '●'}</span>
                             <span style={{ color: 'var(--text)', flex: 1 }}>{inc.m}</span>
                             <span style={{ color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{inc.t}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <div className="ms-card">
               <div className="ms-card-hd">
                  <div className="ms-card-title">Active Fleet Tasks</div>
                  <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => setActiveView('agents')}>+ New Mission</button>
               </div>
               <TaskTable />
            </div>
          </div>
        )}

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
