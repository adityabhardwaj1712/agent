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
import AutonomousView from "./components/AutonomousView";

import { MetricCard, IncidentFeed, DashboardAgentList, ConfigraphWidget } from "./components/DashboardWidgets";

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
      case 'settings': return 'SYSTEM_CONFIGURATION';
      case 'approvals': return 'GUARDRAIL_PROTOCOL';
      case 'audit': return 'SECURITY_AUDIT_LOG';
      case 'billing': return 'RESOURCE_REVENUE';
      case 'protocol': return 'COMMUNICATION_MESH';
      case 'traces': return 'OBSERVABILITY_SURFACE';
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
              <div className="ms-dot ms-dot-g animate-pulse"></div>
              <span className="text-[10px] font-mono text-[var(--t3)] mr-2">SYS_LOAD:</span>
              <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: '10px' }}>NOMINAL</span>
            </div>

            <div className="ms-pill bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.1)]">
              <span className="text-[10px] font-mono text-[var(--t3)] mr-2 text-amber-500">CREDITS:</span>
              <span style={{ color: 'var(--yellow)', fontWeight: 800, fontSize: '10px' }}>${stats.total_cost || '0.00'}</span>
            </div>

            <div className="flex items-center gap-2 ml-4">
               <button className="ms-btn-icon-sm" onClick={fetchGlobalStats}><RefreshCw size={14} /></button>
               <button className="ms-btn-icon-sm"><Bell size={14} /></button>
               <div className="h-4 w-[1px] bg-[var(--bg3)] mx-2"></div>
               <div className="ms-avatar-v2">AD</div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {activeView === 'fleet' && (
          <div className="ms-content" style={{ padding: '0px 24px', animation: 'ms-fade-in 0.8s ease-out', boxSizing: 'border-box' }}>
            
            <div className="flex gap-6 items-start h-full pb-6">

              {/* Left Column (Span 2/3) */}
              <div className="flex-1 flex flex-col gap-6 min-w-0 h-full">
                 
                 {/* KPI Row */}
                 <div className="grid grid-cols-4 gap-4" style={{ height: '120px' }}>
                    <MetricCard title="Active Agents" value={stats.active_agents || 42} subtext="Trend" trend="up" color="var(--blue)" data={[10,25,20,45,35,50]} />
                    <MetricCard title="Success Rate" value={stats.success_rate ? `${stats.success_rate}%` : "99.8%"} subtext="98.5%" trend="neutral" color="var(--green)" data={[95,96,98,99,99.5,99.8]} />
                    <MetricCard title="Avg Latency" value={stats.avg_latency ? `${stats.avg_latency}ms` : "1.2s"} subtext="Trends" trend="down" color="var(--cyan)" data={[2.5,2.0,1.8,1.5,1.3,1.2]} />
                    <MetricCard title="Tokens/Min" value="840k" subtext="840k" trend="up" color="var(--violet)" data={[300,450,400,600,750,840]} />
                 </div>

                 {/* ACP Node Activity */}
                 <div className="ms-glass-panel flex-1 flex overflow-hidden p-0 relative" style={{ minHeight: '440px' }}>
                    
                    {/* Graph Area */}
                    <div className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-95">
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg1)] opacity-50"></div>
                       <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                          <span className="text-[14px] font-bold text-white tracking-wide">ACP Node Activity</span>
                          <div className="flex gap-2">
                             <button className="ms-btn ms-btn-sm" style={{ background: 'var(--bg2)', borderColor: 'var(--bg3)', fontSize: '10px' }}><Cpu size={12} className="mr-1.5"/> Add Node</button>
                             <button className="ms-btn ms-btn-sm" style={{ background: 'var(--bg2)', borderColor: 'var(--bg3)', fontSize: '10px' }}>Select</button>
                             <button className="ms-btn ms-btn-sm ms-btn-p" style={{ fontSize: '10px' }}><Activity size={12} className="mr-1.5"/> Execute Workflow</button>
                          </div>
                       </div>
                       
                       {/* Mock Nodes matching image layout exactly */}
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative w-[500px] h-[300px] mt-10">
                             {/* Trigger */}
                             <div className="absolute top-[120px] left-0 p-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.15)] flex items-center gap-2">
                                <div className="text-[var(--cyan)]"><Activity size={12} /></div>
                                <span className="text-[11px] font-bold text-white">Trigger</span>
                             </div>

                             {/* Top Path */}
                             <div className="absolute top-[20px] left-[140px] p-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md flex flex-col gap-1 w-[130px]">
                                <div className="flex items-center gap-2">
                                   <div className="text-[var(--blue)]"><Search size={12} /></div>
                                   <span className="text-[11px] font-bold text-white">Data Scraper</span>
                                </div>
                                <span className="text-[9px] text-[var(--t3)]">Data Flow (255)</span>
                             </div>
                             
                             <div className="absolute top-[20px] left-[320px] p-3 rounded-xl border border-[var(--violet)] bg-[color-mix(in_srgb,var(--violet)_10%,transparent)] backdrop-blur-md flex flex-col gap-1 w-[130px] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                <div className="flex items-center gap-2">
                                   <div className="text-[var(--violet)]"><Cpu size={12} /></div>
                                   <span className="text-[11px] font-bold text-white">ML Inference</span>
                                </div>
                                <span className="text-[9px] text-[var(--violet)] font-mono">1.25s</span>
                             </div>

                             {/* Middle Path */}
                             <div className="absolute top-[120px] left-[220px] p-3 rounded-xl border border-[rgba(34,211,238,0.3)] bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)] backdrop-blur-md flex flex-col gap-1 w-[130px] shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[var(--cyan)] text-black flex items-center justify-center text-[9px] font-bold">1</span>
                                <div className="flex items-center gap-2">
                                   <div className="text-[var(--cyan)]"><Activity size={12} /></div>
                                   <span className="text-[11px] font-bold text-white">Sentiment Data</span>
                                </div>
                                <span className="text-[9px] text-[var(--cyan)]">Data Flow</span>
                             </div>

                             {/* Bottom Path */}
                             <div className="absolute top-[220px] left-[140px] p-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md flex items-center gap-2">
                                <div className="text-[var(--blue)]"><Box size={12} /></div>
                                <span className="text-[11px] font-bold text-white">Database Write</span>
                             </div>
                             
                             <div className="absolute top-[220px] left-[320px] p-3 rounded-xl border border-[rgba(236,72,153,0.3)] bg-[color-mix(in_srgb,#ec4899_10%,transparent)] backdrop-blur-md flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                                <div className="text-[#ec4899]"><Box size={12} /></div>
                                <span className="text-[11px] font-bold text-white">Save to DB</span>
                             </div>

                             {/* Connections (SVG Lines) */}
                             <svg className="absolute inset-0 w-full h-full -z-10 pointer-events-none overflow-visible">
                                <path d="M 85 135 C 110 135, 110 40, 140 40" fill="none" stroke="var(--cyan)" strokeWidth="2" />
                                <path d="M 85 135 C 130 135, 130 135, 220 135" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeDasharray="4 4" />
                                <path d="M 85 135 C 110 135, 110 235, 140 235" fill="none" stroke="var(--cyan)" strokeWidth="2" />
                                <path d="M 270 40 C 290 40, 290 40, 320 40" fill="none" stroke="var(--violet)" strokeWidth="2" />
                                <path d="M 350 135 C 380 135, 380 235, 320 235" fill="none" stroke="var(--t3)" strokeWidth="1" />
                             </svg>
                          </div>
                       </div>
                    </div>

                    {/* Properties Drawer */}
                    <div className="w-[240px] bg-[rgba(255,255,255,0.01)] border-l border-[rgba(255,255,255,0.05)] p-5 flex flex-col flex-shrink-0 z-10">
                       <div className="flex justify-between items-center mb-6">
                          <span className="text-[11px] font-bold text-[var(--t3)] uppercase tracking-widest">Properties</span>
                          <Search size={14} className="text-[var(--t3)]" />
                       </div>
                       <div className="space-y-5">
                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] text-[var(--t2)] font-bold">Node</label>
                             <input className="fi h-8 px-3 text-[11px] bg-[var(--bg1)] border-[var(--bg3)] rounded" defaultValue="Fetch URL" />
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] text-[var(--t2)] font-bold">Input URL</label>
                             <input className="fi h-8 px-3 text-[11px] bg-[var(--bg1)] border-[var(--bg3)] text-[var(--blue)] font-mono rounded" defaultValue="https://www.example.com/" />
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] text-[var(--t2)] font-bold">API Endpoints</label>
                             <div className="p-2.5 bg-[var(--bg1)] border border-[var(--bg3)] rounded text-[10px] text-[var(--t3)] space-y-1.5 font-mono">
                                <div>API Endpoint 1</div>
                                <div>API Endpoint 2</div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] text-[var(--t2)] font-bold">Retry Policy</label>
                             <select className="fi h-8 px-3 text-[11px] bg-[var(--bg1)] border-[var(--bg3)] text-[var(--t2)] rounded appearance-none">
                                <option>None</option>
                                <option>Exponential Backoff</option>
                             </select>
                          </div>
                          <div className="flex gap-4">
                             <div className="flex flex-col gap-2 flex-1">
                                <label className="text-[10px] text-[var(--t2)] font-bold">Timeout</label>
                                <input className="fi h-8 px-3 text-[11px] bg-[var(--bg1)] border-[var(--bg3)] rounded" defaultValue="3000" />
                             </div>
                             <div className="flex flex-col gap-2 flex-1">
                                <label className="text-[10px] text-[var(--t2)] font-bold">Parallel</label>
                                <input className="fi h-8 px-3 text-[11px] bg-[var(--bg1)] border-[var(--bg3)] rounded" defaultValue="8" />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right Column (Span 1/3) */}
              <div className="w-[360px] flex flex-col gap-6 h-full flex-shrink-0">
                 
                 {/* Agents Box */}
                 <div className="flex-1 min-h-0">
                    <DashboardAgentList />
                 </div>

                 {/* Incident Feed */}
                 <div className="flex-shrink-0">
                    <IncidentFeed />
                 </div>
                 
                 {/* Configraph */}
                 <div className="flex-shrink-0">
                    <ConfigraphWidget />
                 </div>

              </div>
            </div>

            {/* Active Task Queue (Bottom Full Width) */}
            <div className="w-full flex">
               <div className="flex-1 max-w-full overflow-hidden" style={{ margin: '0 -24px -24px -24px' }}>
                  <TaskTable key={refreshKey} />
               </div>
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
          {activeView === 'autonomous' && <AutonomousView />}
          
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
          
          {/* Marketplace & Settings placeholder */}
          {activeView === 'marketplace' && (
            <div className="ms-content flex-center">
               <div className="ms-glass-panel p-16 text-center max-w-md">
                   <Box size={48} className="mx-auto mb-6 text-blue-500 opacity-20" />
                   <div style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>STATION_UNDER_CONSTRUCTION</div>
                   <div style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: '1.6' }}>
                      The Fleet Marketplace is being decentralized. Expected protocol restoration in <span className="text-white">v2.4.0</span>.
                   </div>
               </div>
            </div>
          )}
          {activeView === 'settings' && (
            <div className="ms-content">
               <div className="ms-glass-panel p-8">
                  <div className="ms-sg">
                     <div className="ms-sg-title">API_KEY_INFRASTRUCTURE</div>
                     <div className="ms-set-row"><span className="ms-sl">Anthropic Vector Core</span><div className="font-mono text-[10px] text-blue-400">sk-ant-•••••••••••••</div></div>
                     <div className="ms-set-row"><span className="ms-sl">OpenAI Reasoning Bridge</span><div className="font-mono text-[10px] text-[var(--t3)]">X_NOT_RESOLVED</div></div>
                  </div>
                  <div className="ms-sg mt-12">
                     <div className="ms-sg-title">AXON_ADVANCED_FEATURES</div>
                     <div className="ms-set-row"><span className="ms-sl">Hyper-threaded Reasoning</span><div className="ms-toggle on"></div></div>
                     <div className="ms-set-row"><span className="ms-sl">Auto-Scaling Circuit Breaker</span><div className="ms-toggle on"></div></div>
                     <div className="ms-set-row"><span className="ms-sl">Neural Pruning (Beta)</span><div className="ms-toggle off"></div></div>
                  </div>
               </div>
            </div>
          )}
        </div>
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

