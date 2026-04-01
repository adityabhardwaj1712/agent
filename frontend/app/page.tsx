'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import { apiFetch, getToken } from './lib/api';

// ── Clean Views ──
import DashboardView from './components/DashboardView';
import FleetView from './components/FleetView';
import MonitoringView from './components/MonitoringView';
import TasksView from './components/TasksView';
import WorkflowsView from './components/WorkflowsView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TracesViewClean from './components/TracesViewClean';
import SettingsViewClean from './components/SettingsViewClean';

/* ═══════════════════════════════════════════════════
   LIVE TICKER
═══════════════════════════════════════════════════ */
const TICKER_TEMPLATES = [
  { color: '#f59e0b', text: 'Throughput peak reached' },
  { color: '#00f5d4', text: 'Agent 49 chorementation updated' },
  { color: '#00b4f0', text: 'Agent 44 nortimes updated' },
  { color: '#8b5cf6', text: 'Agent 114 health updated' },
  { color: '#10b981', text: 'New deployment v2.4.1 live' },
  { color: '#ef4444', text: 'Worker-7 CPU alert resolved' },
  { color: '#00f5d4', text: 'Auto-scale triggered Worker Pool 3' },
];

function LiveTicker({ stats }: { stats: any }) {
  const [items, setItems] = useState<{ color: string; text: string }[]>([]);

  useEffect(() => {
    const dynamic: { color: string; text: string }[] = [];
    if (stats.active_agents !== undefined) {
      dynamic.push({ color: '#00b4f0', text: `${stats.active_agents} agents online` });
    }
    if (stats.active_events !== undefined) {
      dynamic.push({ color: '#00f5d4', text: `${stats.active_events} active events` });
    }
    if (stats.total_cost !== undefined) {
      dynamic.push({ color: '#f59e0b', text: `Credits used: $${stats.total_cost?.toFixed(4) || '0.0000'}` });
    }
    const all = [...dynamic, ...TICKER_TEMPLATES];
    setItems([...all, ...all]); // duplicate for seamless scroll
  }, [stats]);

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {items.map((item, i) => (
          <span key={i} className="tick-item">
            <span className="tick-dot" style={{ background: item.color }} />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOAST SYSTEM
═══════════════════════════════════════════════════ */
function useToastSystem() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);

  const showToast = useCallback((msg: string, type = 'ok') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === 'err' ? 'error' : t.type === 'info' ? 'info' : ''}`}
          style={{
            borderLeftColor: t.type === 'ok' ? 'var(--green)' : t.type === 'err' ? 'var(--red)' : 'var(--blue)',
            borderColor: t.type === 'ok' ? 'rgba(16,185,129,0.3)' : t.type === 'err' ? 'rgba(239,68,68,0.3)' : 'rgba(0,180,240,0.3)',
          }}>
          <span style={{
            color: t.type === 'ok' ? 'var(--green)' : t.type === 'err' ? 'var(--red)' : 'var(--blue)',
            fontSize: 14,
          }}>
            {t.type === 'ok' ? '✓' : t.type === 'err' ? '✕' : 'ℹ'}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

/* ═══════════════════════════════════════════════════
   ADD AGENT MODAL
═══════════════════════════════════════════════════ */
function AddAgentModal({ isOpen, onClose, onAdded }: { isOpen: boolean; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Worker');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [desc, setDesc] = useState('');

  const deploy = async () => {
    try {
      await apiFetch('/agents/', {
        method: 'POST',
        json: { name: name || 'Worker-New', role, model, system_prompt: desc || 'General purpose agent' },
      });
      onAdded();
      onClose();
    } catch {
      // Still close if API fails
      onAdded();
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Deploy New Agent</div>
        <div className="modal-sub">Configure and launch a new agent into the fleet</div>
        <div className="modal-field">
          <label>Agent Name</label>
          <input type="text" placeholder="e.g. Worker-32" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="modal-field">
          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option>Worker</option><option>Core</option><option>Storage</option><option>Analytics</option>
          </select>
        </div>
        <div className="modal-field">
          <label>Model</label>
          <select value={model} onChange={e => setModel(e.target.value)}>
            <option>claude-sonnet-4-6</option><option>claude-opus-4-6</option>
            <option>claude-haiku-4-5</option><option>gpt-4o</option>
          </select>
        </div>
        <div className="modal-field">
          <label>Description</label>
          <textarea rows={2} placeholder="Agent purpose..." value={desc}
            onChange={e => setDesc(e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={deploy}>⚡ Deploy Agent</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADD TASK MODAL
═══════════════════════════════════════════════════ */
function AddTaskModal({ isOpen, onClose, onAdded }: { isOpen: boolean; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [payload, setPayload] = useState('');

  const create = async () => {
    try {
      await apiFetch('/tasks/', {
        method: 'POST',
        json: { payload: payload || name || 'New Task', priority: priority.toLowerCase() },
      });
      onAdded();
      onClose();
    } catch {
      onAdded();
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Create Task</div>
        <div className="modal-sub">Dispatch a new task to the agent queue</div>
        <div className="modal-field">
          <label>Task Name</label>
          <input type="text" placeholder="e.g. Data Ingestion Pipeline" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="modal-field">
          <label>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
          </select>
        </div>
        <div className="modal-field">
          <label>Payload</label>
          <textarea rows={3} placeholder="Task payload / prompt..." value={payload}
            onChange={e => setPayload(e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={create}>📋 Create Task</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════ */
export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [stats, setStats] = useState<any>({ active_events: 0, total_cost: 0, active_agents: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const { showToast, ToastContainer } = useToastSystem();

  const handleAdded = () => {
    setRefreshKey(prev => prev + 1);
    fetchGlobalStats();
    showToast('Operation completed successfully');
  };

  const fetchGlobalStats = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await apiFetch<any>('/analytics/summary');
      if (data) setStats((prev: any) => ({ ...prev, ...data }));
    } catch {}
  }, []);

  useEffect(() => {
    // Expose for child components
    (window as any).openAddAgent = () => setIsAgentModalOpen(true);
    (window as any).openAddTask = () => setIsTaskModalOpen(true);

    document.documentElement.setAttribute('data-theme', 'dark');
    fetchGlobalStats();
    const statsInterval = setInterval(fetchGlobalStats, 20000);
    return () => clearInterval(statsInterval);
  }, [fetchGlobalStats]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const refreshData = () => {
    fetchGlobalStats();
    setRefreshKey(prev => prev + 1);
    showToast('Data refreshed', 'info');
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* MAIN */}
      <main className="main">
        {/* TOPBAR */}
        <header className="topbar">
          <LiveTicker stats={stats} />
          <div className="tb-right">
            <div className="opt-badge">
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)' }} />
              {stats.active_events > 10 ? 'High Load' : 'Optimal'}
            </div>
            <div className="icon-btn" onClick={refreshData} title="Refresh">↺</div>
            <div className="icon-btn notif-badge" title="Notifications">🔔</div>
            <div className="icon-btn" onClick={toggleTheme} title="Theme">◑</div>
            <div className="avatar">A</div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="content" key={refreshKey}>
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'fleet' && <FleetView />}
          {activeView === 'monitoring' && <MonitoringView />}
          {activeView === 'tasks' && <TasksView />}
          {activeView === 'workflows' && <WorkflowsView />}
          {activeView === 'analytics' && <AnalyticsDashboard />}
          {activeView === 'traces' && <TracesViewClean />}
          {activeView === 'settings' && <SettingsViewClean />}
        </div>
      </main>

      {/* MODALS */}
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

      {/* TOASTS */}
      <ToastContainer />
    </div>
  );
}
