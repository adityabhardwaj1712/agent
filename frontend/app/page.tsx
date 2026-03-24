'use client';

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import KPIGrid from "./components/KPIGrid";
import IncidentTimeline from "./components/IncidentTimeline";
import TaskTable from "./components/TaskTable";
import AgentTerminal from "./components/AgentTerminal";
import DraggableWidget from "./components/DraggableWidget";
import AgentGallery from "./components/AgentGallery";
import WorkflowBuilder from "./components/WorkflowBuilder";
import { apiJson } from "./lib/api";
import { Plus, Activity, RefreshCw, Sparkles, Zap } from "lucide-react";
import AISuggestions from "./components/AISuggestions";
import AISummaryCard from "./components/AISummaryCard";

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [widgets, setWidgets] = useState<string[]>(['kpi', 'terminal', 'tasks']);
  const [autoMode, setAutoMode] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem("token");
    if (!token && window.location.pathname !== "/landing") {
      window.location.href = "/landing";
    } else {
      setLoading(false);
    }
  }, []);

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const toggleAutoMode = () => {
    setAutoMode(!autoMode);
    apiJson('/auto-mode/' + (autoMode ? 'off' : 'on'), { method: 'POST' });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleReorder = (draggedId: string, targetId: string) => {
    setWidgets((prev: string[]) => {
      const newWidgets = [...prev];
      const draggedIndex = newWidgets.indexOf(draggedId);
      const targetIndex = newWidgets.indexOf(targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, draggedId);
      return newWidgets;
    });
  };

  if (loading) return null;

  return (
    <div className="ac-shell">
      {/* Sidebar Component */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        onRegisterAgent={() => setActiveView('agents')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="ac-main">
        
        {/* Header Component */}
        <header className="ac-header">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white uppercase italic">
              {activeView === 'dashboard' ? 'Neural Analytics' : activeView.replace('-', ' ')}
            </h1>
            <p className="text-[10px] text-tertiary uppercase tracking-[0.2em]">
              {activeView === 'dashboard' ? 'Real-time performance metrics and financial health monitoring for the autonomous AXON network.' : 'Fleet Management System v1.0'}
            </p>
          </div>

          <div className="ac-header-actions">
            {/* AUTO MODE TOGGLE */}
            <button 
              onClick={toggleAutoMode}
              className={`ac-chip gap-2 transition-all ${autoMode ? 'border-g/30 text-g' : 'border-r/30 text-r'}`}
            >
              <Zap size={12} className={autoMode ? 'animate-pulse' : ''} />
              AUTO MODE: {autoMode ? 'ON' : 'OFF'}
            </button>

            <div className="ac-chip hidden md:flex">
              <span className="dot dot-g dot-pulse"></span>
              99.9% Health
            </div>
            
            <button className="btn btn-p btn-sm" onClick={() => setActiveView('agents')}>
              <Plus size={16} className="mr-2" /> New Agent
            </button>

            <button className="ac-header-btn" onClick={toggleTheme}>
              <Sparkles size={18} />
            </button>
          </div>
        </header>

        {/* View Switcher */}
        <div className="ac-content-container">
          {activeView === 'dashboard' && (
            <div className="animate-slide-in">
              {/* IMPACT METRICS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 mt-8">
                <MetricSmall label="Execution Success" value="+2.1%" color="text-g" />
                <MetricSmall label="Active Pulse" value="1" color="text-a" />
                <MetricSmall label="Operational Flux" value="$42.12" color="text-y" />
                <MetricSmall label="Audit Integrity" value="100%" color="text-c" />
              </div>

              <KPIGrid />
              
              <div className="ac-dashboard-row mt-12">
                <div className="flex flex-col gap-6">
                  <div className="ac-widget h-[500px] flex flex-col">
                    <div className="ac-widget-title">
                      <span>Decision Stream</span>
                      <Activity size={16} className="text-tertiary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <AgentTerminal />
                    </div>
                  </div>
                  
                  <div className="ac-widget">
                    <div className="ac-widget-title">
                      <span>Recent Activity</span>
                    </div>
                    <div className="card-body">
                      <IncidentTimeline />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="ac-widget h-full">
                    <div className="ac-widget-title">
                      <span className="flex items-center gap-2">
                        AI DECISIONS
                        <Sparkles size={14} className="text-a animate-pulse" />
                      </span>
                    </div>
                    <div className="overflow-y-auto max-h-[800px]">
                      <AISummaryCard />
                      <div className="mt-8">
                        <AISuggestions />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 mt-6">
                  <div className="ac-widget p-0">
                    <div className="ac-widget-title p-6 mb-0 border-b border-border">
                      <span>Task Orchestration</span>
                      <button 
                         onClick={() => apiJson('/tasks/retry', { method: 'POST' })}
                         className="btn btn-sm btn-p text-[10px] uppercase px-3"
                      >
                         <RefreshCw size={12} className="mr-2" /> Bulk Retry Failed
                      </button>
                    </div>
                    <TaskTable />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'workflow' && (
            <div className="mt-8"><WorkflowBuilder /></div>
          )}

          {activeView === 'agents' && (
            <div className="mt-8"><AgentGallery /></div>
          )}

          {/* Placeholder for other views */}
          {!['dashboard', 'workflow', 'agents'].includes(activeView) && (
            <div className="view-body p-8 flex items-center justify-center text-tertiary mono">
              Section [{activeView.toUpperCase()}] is under development.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricSmall({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-[#161D2E] p-4 rounded-xl border border-[#2A3356]">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

