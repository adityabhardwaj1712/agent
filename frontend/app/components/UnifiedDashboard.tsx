'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Shield, Cpu, Zap, Eye, CheckCircle, AlertCircle, Play, Save, Server, Database, Activity as ActivityIcon, Plus } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

export default function UnifiedDashboard({ onOpenAgentModal, onOpenTaskModal }: { onOpenAgentModal: () => void, onOpenTaskModal: () => void }) {
  const [stats, setStats] = useState<any>({ active_agents: 0, task_success_rate: 0, pending_approvals: 0, total_traces_today: 0, system_latency: 0 });
  const [health, setHealth] = useState<any>({ api: 'checking', db: 'checking', redis: 'checking' });
  const [agents, setAgents] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    try {
      // 1. Stats & Health
      const summary = await apiFetch<any>('/analytics/summary');
      setStats(summary);
      
      const statusRes = await apiFetch<any>('/system/status');
      setHealth({
        api: 'online',
        db: statusRes.components.database.status === 'connected' ? 'online' : 'offline',
        redis: statusRes.components.redis.status === 'connected' ? 'online' : 'offline'
      });

      // 2. Agents
      const agentsList = await apiFetch<any[]>('/agents/');
      setAgents(agentsList.slice(0, 5));

      // 3. Recent Traces as "Events"
      const traces = await apiFetch<any[]>('/traces');
      setRecentEvents(traces.slice(0, 10));

    } catch (err) {
      console.error('Unified fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const runSampleWorkflow = async () => {
    try {
      await apiFetch('/workflows/run', {
        method: 'POST',
        body: JSON.stringify({ name: 'Diagnostic Pipeline', nodes: [], edges: [] })
      });
      toast('Workflow triggered successfully', 'ok');
      fetchData();
    } catch (err) {
      toast('Failed to trigger workflow', 'err');
    }
  };

  if (loading && !stats) return <div style={{ padding: 40, color: 'var(--s-t3)' }}>Initializing Unified Command...</div>;

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg1)', minHeight: '100%' }}>
      
      {/* Top Row: System Health & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: health.api === 'online' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', padding: 8, borderRadius: 8 }}>
            <Server size={20} color={health.api === 'online' ? 'var(--g)' : 'var(--r)'} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>API GATEWAY</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: health.api === 'online' ? 'var(--g)' : 'var(--r)' }}>{health.api.toUpperCase()}</div>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: health.db === 'online' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', padding: 8, borderRadius: 8 }}>
            <Database size={20} color={health.db === 'online' ? 'var(--g)' : 'var(--r)'} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>DATABASE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: health.db === 'online' ? 'var(--g)' : 'var(--r)' }}>{health.db.toUpperCase()}</div>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(79,142,255,.1)', padding: 8, borderRadius: 8 }}>
            <Cpu size={20} color="var(--blue)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>ACTIVE AGENTS</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{stats.active_agents}</div>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(245,158,11,.1)', padding: 8, borderRadius: 8 }}>
            <Shield size={20} color="var(--y)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>PENDING CHECKS</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{stats.pending_approvals}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, flex: 1 }}>
        
        {/* Left Column: Events & Agents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Live Events Area */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-hd">
              <div className="card-hd-title">Live Execution Stream</div>
              <div className="pill"><span className="dot dot-g"></span>Listening</div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ height: 300, overflow: 'auto' }}>
                {recentEvents.length === 0 && <div style={{ padding: 20, color: 'var(--t3)', textAlign: 'center' }}>No recent events found.</div>}
                {recentEvents.map((t, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--g)' }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{t.agent_id} <span style={{ color: 'var(--t3)', fontWeight: 400 }}>executed</span> {t.step}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>Task: {t.task_id} · {new Date(t.created_at).toLocaleTimeString()}</div>
                    </div>
                    <div style={{ fontSize: 10, background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--mono)' }}>TRC-{t.trace_id.slice(0,4)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Registry */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-title">Active Fleet</div>
              <button className="btn btn-sm" style={{ padding: '4px 8px' }}>View All</button>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {agents.map(a => (
                <div key={a.agent_id} style={{ background: 'var(--bg2)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>{a.role}</div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="dot dot-g"></span>
                    <span style={{ fontSize: 10, color: 'var(--g)', fontWeight: 600 }}>READY</span>
                  </div>
                </div>
              ))}
              {agents.length === 0 && <div style={{ gridColumn: '1/-1', color: 'var(--t3)', fontSize: 12 }}>No agents found in registry.</div>}
            </div>
          </div>

        </div>

        {/* Right Column: Actions & Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="card">
            <div className="card-hd"><div className="card-hd-title">Command Center</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-p" onClick={onOpenTaskModal} style={{ justifyContent: 'center', gap: 10 }}>
                <Plus size={16} /> Create New Task
              </button>
              <button className="btn btn-b" onClick={onOpenAgentModal} style={{ justifyContent: 'center', gap: 10 }}>
                <Cpu size={16} /> Register Agent
              </button>
              <button className="btn" onClick={runSampleWorkflow} style={{ justifyContent: 'center', gap: 10 }}>
                <Play size={16} /> Run Diagnostic
              </button>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79,142,255,.1) 0%, rgba(168,85,247,.1) 100%)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)' }}>PERFORMANCE</div>
                <Zap size={14} color="var(--blue)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--t2)' }}>Success Rate</span>
                    <span style={{ fontWeight: 600 }}>{stats.task_success_rate}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${stats.task_success_rate}%`, background: 'var(--g)', borderRadius: 2 }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--t2)' }}>Avg. Latency</span>
                    <span style={{ fontWeight: 600 }}>{stats.system_latency}ms</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: '40%', background: 'var(--blue)', borderRadius: 2 }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
