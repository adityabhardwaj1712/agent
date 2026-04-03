'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import { apiFetch, getToken } from './lib/api';
import { usePolling } from './lib/usePolling';

import dynamic from 'next/dynamic';

// ── Critical Shared Views (Fast Load) ──
import DashboardView from './components/DashboardView';
import FleetView from './components/FleetView';
import TasksView from './components/TasksView';

// ── Heavy Modules (Lazy Loaded/RAM Optimized) ──
const ObservabilityView = dynamic(() => import('./components/ObservabilityView'), { 
  loading: () => <div className="ms-loader-ring" style={{ margin: '100px auto' }} />
});
const WorkflowsView = dynamic(() => import('./components/WorkflowsView'));
const AnalyticsDashboard = dynamic(() => import('./components/AnalyticsDashboard'));
const TracesViewClean = dynamic(() => import('./components/TracesViewClean'));
const SettingsView = dynamic(() => import('./components/SettingsView'));

const AutonomousView = dynamic(() => import('./components/AutonomousView'));
const KnowledgeHub = dynamic(() => import('./components/KnowledgeHub'));
const BillingView = dynamic(() => import('./components/BillingView'));
const MarketplaceView = dynamic(() => import('./components/MarketplaceView'));
const AuditView = dynamic(() => import('./components/AuditView'));
const ProtocolView = dynamic(() => import('./components/ProtocolView'));

/* ═══════════════════════════════════════════════════
   LIVE TICKER
═══════════════════════════════════════════════════ */
const TICKER_TEMPLATES = [
  { color: 'var(--orange)', text: 'THROUGHPUT_SURGE: SECTOR_7_PEAK' },
  { color: 'var(--cyan)', text: 'NEURAL_LINK_ESTABLISHED: UNIT_49' },
  { color: 'var(--blue)', text: 'CORE_SYNCHRONIZATION_COMPLETE: V2.4.1' },
  { color: 'var(--purple)', text: 'MEMORY_FRAGMENT_DEFRAGMENTATION: ACTIVE' },
  { color: 'var(--green)', text: 'MISSION_SUCCESS: OP_SILENT_STORM' },
  { color: 'var(--red)', text: 'INTRUSION_ATTEMPT_SHIELDED: GATEWAY_01' },
  { color: 'var(--cyan)', text: 'AUTO_SCALE_TRIGGERED: WORKER_POOL_EPSILON' },
];

function LiveTicker({ stats }: { stats: any }) {
  const [items, setItems] = useState<{ color: string; text: string }[]>([]);

  useEffect(() => {
    const dynamic: { color: string; text: string }[] = [];
    if (stats.active_agents !== undefined) {
      dynamic.push({ color: 'var(--cyan)', text: `FLEET_STRENGTH: ${stats.active_agents} NODES` });
    }
    if (stats.active_events !== undefined) {
      dynamic.push({ color: 'var(--green)', text: `ACTIVE_SIGNALS: ${stats.active_events} STREAMING` });
    }
    if (stats.total_cost !== undefined) {
      dynamic.push({ color: 'var(--orange)', text: `RES_BURN: $${stats.total_cost?.toFixed(3) || '0.000'}` });
    }
    const all = [...dynamic, ...TICKER_TEMPLATES];
    setItems([...all, ...all]);
  }, [stats]);

  return (
    <div className="ticker-wrap terminal-flicker">
      <div className="ticker">
        {items.map((item, i) => (
          <span key={i} className="tick-item" style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px' }}>
            <span className="tick-dot" style={{ background: item.color, boxShadow: `0 0 5px ${item.color}` }} />
            {item.text.toUpperCase()}
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
    setToasts(prev => [...prev, { id, msg: msg.toUpperCase(), type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === 'err' ? 'error' : t.type === 'info' ? 'info' : ''}`}
          style={{
            borderLeft: `2px solid ${t.type === 'ok' ? 'var(--green)' : t.type === 'err' ? 'var(--red)' : 'var(--blue)'}`,
            background: 'var(--bg2)',
            fontFamily: 'var(--mono)',
            fontSize: '10px'
          }}>
          <span style={{ color: t.type === 'ok' ? 'var(--green)' : t.type === 'err' ? 'var(--red)' : 'var(--blue)' }}>
            [ {t.type === 'ok' ? 'SUCCESS' : t.type === 'err' ? 'CRITICAL' : 'SIGNAL'} ]
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
  const [model, setModel] = useState('gemma-3-4b');
  const [desc, setDesc] = useState('');

  const deploy = async () => {
    try {
      await apiFetch('/agents/', {
        method: 'POST',
        json: { name: name || 'UNIT_X', role, model, system_prompt: desc || 'GENERAL_PURPOSE_OPS' },
      });
      onAdded(); onClose();
    } catch { onAdded(); onClose(); }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ border: '1px solid var(--cyan)', boxShadow: 'var(--glow-lg)' }}>
        <div className="scanline"></div>
        <div className="modal-title" style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>DECOMPILING_NEW_UNIT...</div>
        <div className="modal-sub">SECURE_INITIALIZATION_PROTOCOL_V4.2</div>
        
        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>CALLSIGN_ASSIGNMENT</label>
          <input type="text" placeholder="e.g. OMEGA_LEADER" value={name} onChange={e => setName(e.target.value)} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="modal-field">
            <label style={{ fontSize: '9px', opacity: 0.6 }}>CLASS_STANCE</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option>Worker</option><option>Core</option><option>Storage</option><option>Analytics</option>
            </select>
          </div>
          <div className="modal-field">
            <label style={{ fontSize: '9px', opacity: 0.6 }}>NEURAL_ENGINE</label>
            <select value={model} onChange={e => setModel(e.target.value)}>
              <option>gemma-3-4b</option><option>llama-3-70b</option>
              <option>claude-3-5-sonnet</option><option>gpt-4o-mini</option>
            </select>
          </div>
        </div>

        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>MISSION_PARAMETERS</label>
          <textarea rows={2} placeholder="DEFINE_OBJECTIVES..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>[ ABORT ]</button>
          <button className="btn btn-primary btn-sm" style={{ background: 'var(--cyan)', color: '#000' }} onClick={deploy}>[ INITIATE_DEPLOYMENT ]</button>
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
        json: { payload: payload || name || 'MISSION_SIG', priority: priority.toLowerCase() },
      });
      onAdded(); onClose();
    } catch { onAdded(); onClose(); }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ border: '1px solid var(--purple)', boxShadow: '0 0 30px rgba(112,0,255,0.3)' }}>
        <div className="modal-title" style={{ color: 'var(--purple)', fontFamily: 'var(--mono)' }}>ENQUEUE_NEW_MISSION...</div>
        <div className="modal-sub">PRIORITY_QUEUE_LINK_ESTABLISHED</div>
        
        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>MISSION_IDENTIFIER</label>
          <input type="text" placeholder="e.g. DATA_HARVEST_ALPHA" value={name} onChange={e => setName(e.target.value)} />
        </div>
        
        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>THREAT_LEVEL_PRIORITY</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
          </select>
        </div>

        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>PAYLOAD_STREAM</label>
          <textarea rows={3} placeholder="MISSION_COMMANDS..." value={payload} onChange={e => setPayload(e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>[ CANCEL ]</button>
          <button className="btn btn-primary btn-sm" style={{ background: 'var(--purple)', color: '#fff' }} onClick={create}>[ DISPATCH_MISSION ]</button>
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const { showToast, ToastContainer } = useToastSystem();

  const handleAdded = () => {
    setRefreshKey(prev => prev + 1);
    fetchGlobalStats();
    showToast('COMMAND_EXECUTED_SUCCESSFULLY');
  };

  const fetchGlobalStats = useCallback(async () => {
    if (!getToken()) return;
    try {
      const authData = await apiFetch<any>('/auth/me');
      if (authData) setCurrentUser(authData);
      
      const data = await apiFetch<any>('/analytics/summary');
      if (data) setStats((prev: any) => ({ ...prev, ...data }));

      const notifs = await apiFetch<any[]>('/notifications/');
      if (notifs) setNotifications(notifs);
    } catch {}
  }, []);

  useEffect(() => {
    // 1. Auth Guard
    if (!getToken()) {
      window.location.href = '/login';
      return;
    }

    (window as any).openAddAgent = () => setIsAgentModalOpen(true);
    (window as any).openAddTask = () => setIsTaskModalOpen(true);
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  usePolling(fetchGlobalStats, 15000, true);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const refreshData = () => {
    fetchGlobalStats();
    setRefreshKey(prev => prev + 1);
    showToast('RE_SCANNING_SYSTEM_MATRICES', 'info');
  };

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="main">
        <header className="topbar">
          <div className="scanline"></div>
          <LiveTicker stats={stats} />
          <div className="tb-right">
            <div className="opt-badge" style={{ 
              borderColor: 'var(--border2)', 
              background: 'rgba(0,242,255,0.05)',
              color: 'var(--cyan)',
              fontFamily: 'var(--mono)',
              fontSize: '9px'
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 5px var(--cyan)' }} />
              SIGNAL: {stats.active_events > 15 ? 'HIGH_INTENSITY' : 'OPTIMAL'}
            </div>
            <div className="icon-btn" onClick={refreshData} title="RE_SCAN">↺</div>
            <div style={{ position: 'relative' }}>
                <div className="icon-btn notif-badge" title="ALERTS" onClick={() => setShowNotifs(!showNotifs)}>
                    🔔
                    {notifications.filter(n => !n.is_read).length > 0 && <span className="notif-count" style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '10px', pointerEvents: 'none' }}>{notifications.filter(n => !n.is_read).length}</span>}
                </div>
                {showNotifs && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, width: 300, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, zIndex: 100, boxShadow: 'var(--glow-lg)', maxHeight: 400, overflowY: 'auto' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                           SYSTEM ALERTS
                           <button onClick={(e) => {
                               e.stopPropagation();
                               apiFetch('/notifications/read-all', { method: 'POST' }).then(() => fetchGlobalStats());
                           }} style={{ color: 'var(--cyan)' }}>Mark All Read</button>
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center', padding: 20 }}>NO_ALERTS_DETECTED</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--bg3)', opacity: n.is_read ? 0.6 : 1, cursor: 'pointer' }} onClick={() => {
                                    apiFetch(`/notifications/${n.id}/read`, { method: 'PATCH' }).then(() => fetchGlobalStats());
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: n.type === 'error' ? 'var(--red)' : n.type === 'success' ? 'var(--green)' : 'var(--blue)' }}>{n.title.toUpperCase()}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 4 }}>{n.message}</div>
                                    <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <div className="avatar" style={{ border: '1px solid var(--cyan)', boxShadow: 'var(--glow)', cursor: 'pointer' }} onClick={() => setActiveView('settings')}>
              {currentUser?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div className="content" key={refreshKey} style={{ background: 'var(--bg0)' }}>
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'fleet' && <FleetView />}
          {activeView === 'monitoring' && <ObservabilityView />}
          {activeView === 'tasks' && <TasksView />}
          {activeView === 'workflows' && <WorkflowsView />}
          {activeView === 'analytics' && <AnalyticsDashboard />}
          {activeView === 'traces' && <TracesViewClean />}
          {activeView === 'knowledge' && <KnowledgeHub />}
          {activeView === 'marketplace' && <MarketplaceView />}
          {activeView === 'audit' && <AuditView />}
          {activeView === 'protocol' && <ProtocolView />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </main>

      <AddAgentModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} onAdded={handleAdded} />
      <AddTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onAdded={handleAdded} />
      <ToastContainer />
    </div>
  );
}
