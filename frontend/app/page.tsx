'use client';

import React, { useState, useEffect } from "react";
import ProtocolGraph from "./components/ProtocolGraph";
import KPIGrid from "./components/KPIGrid";
import IncidentTimeline from "./components/IncidentTimeline";
import TaskTable from "./components/TaskTable";
import AgentTerminal from "./components/AgentTerminal";
import DraggableWidget from "./components/DraggableWidget";
import { apiJson } from "./lib/api";

export default function Home() {
  const [widgets, setWidgets] = useState<string[]>(['kpi', 'graph', 'terminal', 'tasks']);
  const [traces, setTraces] = useState<any[]>([]);

  useEffect(() => {
    async function loadTraces() {
      const r = await apiJson<any[]>("/traces");
      if (r.ok) setTraces(r.data);
    }
    loadTraces();
  }, []);

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

  return (
    <div className="flex flex-col gap-8 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-bold text-primary" style={{ color: 'var(--text-primary)' }}>
            Good morning, <span className="gradient-text">John 👋</span>
          </h2>
          <p className="mt-1 text-secondary" style={{ color: 'var(--text-secondary)' }}>
            Here's what's happening with your agents today
          </p>
        </div>
        <div className="flex gap-3">
          <button className="glass-card px-4 py-2 rounded-xl hover:scale-105 transition flex items-center">
            <div className="ac-status-dot-live mr-2"></div>
            <span className="font-medium text-primary" style={{ color: 'var(--text-primary)' }}>System Optimal</span>
          </button>
          <button className="gradient-bg px-6 py-2 rounded-xl text-white font-medium hover:opacity-90 transition glow flex items-center shadow-lg">
            <Plus size={18} className="mr-2" />
            New Agent
          </button>
        </div>
      </div>

      {/* KPI Grid Section */}
      <KPIGrid />

      {/* Dynamic Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {widgets.map((widgetId: string) => {
          if (widgetId === 'kpi') return null; // Already rendered above
          
          if (widgetId === 'terminal') {
            return (
              <div key="terminal" className="lg:col-span-2 flex flex-col gap-6">
                <DraggableWidget id="terminal" onReorder={handleReorder}>
                  <div className="glass-card rounded-2xl p-6 h-[500px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-primary" style={{ color: 'var(--text-primary)' }}>Neural Feed</h3>
                      <button className="text-tertiary hover:text-primary transition" style={{ color: 'var(--text-tertiary)' }}><Activity size={18} /></button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <AgentTerminal />
                    </div>
                  </div>
                </DraggableWidget>
                <DraggableWidget id="timeline" onReorder={handleReorder}>
                   <div className="glass-card rounded-2xl p-6">
                     <h3 className="text-xl font-bold mb-4 text-primary" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
                     <IncidentTimeline />
                   </div>
                </DraggableWidget>
              </div>
            )
          }
          
          if (widgetId === 'graph') {
            return (
              <DraggableWidget key="graph" id="graph" onReorder={handleReorder}>
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-primary" style={{ color: 'var(--text-primary)' }}>Architecture Pulse</h3>
                    <div className="badge badge-info bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded text-[10px] font-bold">LIVE</div>
                  </div>
                  <div className="flex-1 relative min-h-[300px]">
                    <ProtocolGraph events={traces} />
                  </div>
                </div>
              </DraggableWidget>
            );
          }
          
          if (widgetId === 'tasks') {
            return (
              <div key="tasks" className="lg:col-span-3">
                <DraggableWidget id="tasks" onReorder={handleReorder}>
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-primary" style={{ color: 'var(--text-primary)' }}>Active Tasks</h3>
                      <button className="text-sm font-medium gradient-text hover:opacity-80">View All Tasks</button>
                    </div>
                    <TaskTable />
                  </div>
                </DraggableWidget>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
