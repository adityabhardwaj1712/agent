'use client';

import React, { useState, useEffect } from "react";
import ProtocolGraph from "./components/ProtocolGraph";
import KPIGrid from "./components/KPIGrid";
import IncidentTimeline from "./components/IncidentTimeline";
import TaskTable from "./components/TaskTable";
import DraggableWidget from "./components/DraggableWidget";

export default function Home() {
  const [widgets, setWidgets] = useState<string[]>(['kpi', 'graph', 'tasks']);
  const [traces, setTraces] = useState<any[]>([]);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    fetch(`${base}/v1/traces`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : [])
      .then(data => setTraces(data))
      .catch(() => {});
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'slideUp 0.6s ease-out' }}>
      <header style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          System Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Real-time monitoring of autonomous agent collaborations and protocol health.
        </p>
      </header>

      {widgets.map((widgetId: string) => {
        if (widgetId === 'kpi') {
          return (
            <DraggableWidget key="kpi" id="kpi" onReorder={handleReorder}>
              <KPIGrid />
            </DraggableWidget>
          );
        }
        if (widgetId === 'graph') {
          return (
            <DraggableWidget key="graph" id="graph" onReorder={handleReorder}>
              <div className="ac-dashboard-row">
                <div className="ac-widget" style={{ padding: 0, overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                  <div className="ac-widget-title" style={{ padding: '24px 24px 0 24px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>Live Agent Collaboration</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>ACP Protocol Flow</span>
                     </div>
                     <div className="ac-pill" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-primary)', border: '1px solid var(--border-active)' }}>
                        Connected
                     </div>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <ProtocolGraph events={traces} />
                  </div>
                </div>
                <IncidentTimeline />
              </div>
            </DraggableWidget>
          );
        }
        if (widgetId === 'tasks') {
          return (
            <DraggableWidget key="tasks" id="tasks" onReorder={handleReorder}>
              <div style={{ marginBottom: '20px' }}>
                <TaskTable />
              </div>
            </DraggableWidget>
          );
        }
        return null;
      })}
    </div>
  );
}
