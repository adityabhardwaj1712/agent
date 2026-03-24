'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export default function DashboardView() {
  const [metrics, setMetrics] = useState({
    active_agents: 0,
    tasks_completed: 0,
    success_rate: '0%',
    latency: '0ms',
    active_events: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        setMetrics({
          active_agents: data.active_agents,
          tasks_completed: data.tasks_completed,
          success_rate: `${((1 - data.error_rate) * 100).toFixed(1)}%`,
          latency: `${data.avg_latency}ms`,
          active_events: data.active_events
        });
        
        const tasks = await apiFetch<any[]>('/tasks');
        setRecentTasks(tasks.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ms-content">
      {/* KPI Grid */}
      <div className="ms-kpi-grid">
        <div className="ms-kpi" style={{ '--kc': 'var(--s-blue)' } as any}>
          <div className="ms-kpi-lbl">Active Agents</div>
          <div className="ms-kpi-val" style={{ color: 'var(--s-blue)' }}>{metrics.active_agents}</div>
          <div className="ms-kpi-delta ms-up">↑ LIVE</div>
          <div className="ms-kpi-ico">🤖</div>
        </div>
        <div className="ms-kpi" style={{ '--kc': 'var(--s-purple)' } as any}>
          <div className="ms-kpi-lbl">Total Tasks</div>
          <div className="ms-kpi-val" style={{ color: 'var(--s-purple)' }}>{metrics.tasks_completed}</div>
          <div className="ms-kpi-delta ms-up">↑ ALL TIME</div>
          <div className="ms-kpi-ico">⚡</div>
        </div>
        <div className="ms-kpi" style={{ '--kc': 'var(--s-green)' } as any}>
          <div className="ms-kpi-lbl">Success Rate</div>
          <div className="ms-kpi-val" style={{ color: 'var(--s-green)' }}>{metrics.success_rate}</div>
          <div className="ms-kpi-delta ms-up">↑ NOMINAL</div>
          <div className="ms-kpi-ico">✅</div>
        </div>
        <div className="ms-kpi" style={{ '--kc': 'var(--s-cyan)' } as any}>
          <div className="ms-kpi-lbl">Avg Latency</div>
          <div className="ms-kpi-val" style={{ color: 'var(--s-cyan)' }}>{metrics.latency}</div>
          <div className="ms-kpi-delta ms-dn">↓ OPTIMIZED</div>
          <div className="ms-kpi-ico">⏱</div>
        </div>
      </div>

      {/* Two Column Layout (ACP Flow / Incident) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        <div className="ms-card">
          <div className="ms-card-hd">
            <div className="ms-card-title">Live Agent Collaboration</div>
            <div className="ms-badge ms-b-b">Telemetry · {metrics.active_events} events</div>
          </div>
          <div className="ms-card-body" style={{ padding: 0 }}>
            {/* Real-time Telemetry Visual */}
            <div style={{ height: 180, background: 'var(--s-bg)', borderBottom: '1px solid var(--s-border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, var(--s-border) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }}></div>
              <div style={{ position: 'absolute', padding: '6px 12px', background: 'var(--s-bg2)', border: '1px solid var(--s-border2)', borderRadius: 6, fontSize: 13, color: 'var(--s-text)', top: 20, left: 40, borderLeft: '3px solid var(--s-green)' }}>Axon.Relay</div>
              <div style={{ position: 'absolute', padding: '6px 12px', background: 'var(--s-bg2)', border: '1px solid var(--s-border2)', borderRadius: 6, fontSize: 13, color: 'var(--s-text)', top: 20, left: 220, borderLeft: '3px solid var(--s-blue)' }}>Orchestrator</div>
              
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <line x1="165" y1="35" x2="210" y2="35" stroke="var(--s-border3)" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="ms-card">
          <div className="ms-card-hd">
            <div className="ms-card-title">Incident Timeline</div>
            <div className="ms-badge ms-b-r">{recentTasks.filter(t => t.status === 'failed').length} errors</div>
          </div>
          <div className="ms-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentTasks.length === 0 && <div style={{ color: 'var(--s-t3)', fontSize: 12 }}>No recent activity.</div>}
              {recentTasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottom: i < recentTasks.length - 1 ? '1px solid var(--s-border)' : 'none' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: t.status === 'failed' ? 'rgba(255,77,106,.15)' : 'rgba(0,229,160,.15)', color: t.status === 'failed' ? 'var(--s-red)' : 'var(--s-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                    {t.status === 'failed' ? '✕' : '✓'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--s-t2)' }}>
                      <strong>{t.agent_id}</strong>: {t.status}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--s-t3)', marginTop: 4 }}>
                      {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Tasks Table */}
      <div className="ms-card">
        <div className="ms-card-hd">
          <div className="ms-card-title">Active Agent Tasks</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ms-btn ms-btn-g ms-btn-sm">Sort by ↕</button>
            <button className="ms-btn ms-btn-g ms-btn-sm">⊞ View All</button>
          </div>
        </div>
        <div className="ms-card-body" style={{ padding: 0 }}>
          <table className="ms-tbl">
            <thead>
              <tr><th>Task ID</th><th>Agent</th><th>Status</th><th>Duration</th><th>Last Event</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="p" style={{ fontFamily: 'var(--mono)' }}>1234572060</td>
                <td>Research Agent</td>
                <td><span className="ms-badge ms-b-b">Status</span></td>
                <td>32 min</td>
                <td style={{ color: 'var(--s-t3)' }}>Jan 7, 3:32 PM</td>
              </tr>
              <tr>
                <td className="p" style={{ fontFamily: 'var(--mono)' }}>1234572002</td>
                <td>Data Analyst</td>
                <td><span className="ms-badge ms-b-y">Warning</span></td>
                <td>35 min</td>
                <td style={{ color: 'var(--s-t3)' }}>Sep 7, 3:32 PM</td>
              </tr>
              <tr>
                <td className="p" style={{ fontFamily: 'var(--mono)' }}>1234572063</td>
                <td>Editor</td>
                <td><span className="ms-badge ms-b-r">Critical</span></td>
                <td>55m ago</td>
                <td style={{ color: 'var(--s-t3)' }}>Jan 7, 3:25 PM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
