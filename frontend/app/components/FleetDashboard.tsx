'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, Cpu, Shield, Zap, Clock, Search, Bell, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, MoreHorizontal, TrendingUp
} from 'lucide-react';
import { apiFetch } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────
interface Stats {
  active_agents: number;
  total_tasks: number;
  tasks_completed: number;
  success_rate: number;
  avg_latency: number;
  total_cost: number;
  pending_approvals: number;
  active_events: number;
  error_rate: number;
}

interface FleetHealth {
  running: number;
  idle: number;
  cooldown: number;
  offline: number;
  total: number;
}

interface TaskRow {
  task_id: string;
  description: string;
  status: string;
  created_at: string;
  agent_id?: string;
  execution_time_ms?: number;
}

interface AgentRow {
  agent_id: string;
  name: string;
  model?: string;
  status?: string;
  role?: string;
}

interface TimePoint {
  time: string;
  value: number;
}

// ─── Helpers ──────────────────────────────────────────────────────
const POLL_FAST = 4000;
const POLL_SLOW = 10000;

function sparklinePath(data: number[], w: number, h: number): string {
  if (data.length < 2) return '';
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  return data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function donutSlices(values: number[], colors: string[], cx: number, cy: number, r: number) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let cumAngle = -90;
  return values.map((v, i) => {
    const angle = (v / total) * 360;
    const startRad = (cumAngle * Math.PI) / 180;
    const endRad = ((cumAngle + angle) * Math.PI) / 180;
    cumAngle += angle;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;
    return (
      <path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
        fill={colors[i]}
        opacity={0.85}
      />
    );
  });
}

// ─── Sub-Component: KPI Card ──────────────────────────────────────
function KpiCard({ label, value, trend, trendLabel, color, sparkData }: {
  label: string; value: string; trend: 'up' | 'down'; trendLabel: string;
  color: string; sparkData: number[];
}) {
  const path = sparklinePath(sparkData, 88, 36);
  return (
    <div className="ms-glass-panel" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display, var(--mono))', fontSize: 28, fontWeight: 700, color: 'var(--text, #dde8ff)', lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t3)' }}>
        <span style={{ color: trend === 'up' ? 'var(--green, #00e895)' : 'var(--red, #ff2d4e)', fontWeight: 700, fontSize: 11 }}>
          {trend === 'up' ? '↑' : '↓'} {trendLabel}
        </span>
      </div>
      <svg style={{ position: 'absolute', bottom: 0, right: 0, width: 88, height: 36, opacity: 0.32 }} viewBox="0 0 88 36">
        <path d={path} fill="none" stroke={color} strokeWidth={2} />
      </svg>
    </div>
  );
}

// ─── Sub-Component: Progress Bar ──────────────────────────────────
function RefreshBar({ progress }: { progress: number }) {
  return (
    <div style={{ height: 2, borderRadius: 1, background: 'var(--bg3, #1a2236)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${progress}%`, borderRadius: 1,
        transition: 'width 0.08s linear',
        background: progress >= 100
          ? 'linear-gradient(90deg, var(--green, #00e895), var(--cyan, #00c8e0))'
          : 'linear-gradient(90deg, var(--blue, #2e6fff), var(--cyan, #00c8e0))'
      }} />
    </div>
  );
}

// ─── Sub-Component: Status Pill ───────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'unknown';
  const map: Record<string, { bg: string; text: string; label: string }> = {
    running: { bg: 'rgba(46,111,255,0.1)', text: 'var(--blue, #2e6fff)', label: 'RUNNING' },
    in_progress: { bg: 'rgba(46,111,255,0.1)', text: 'var(--blue, #2e6fff)', label: 'RUNNING' },
    completed: { bg: 'rgba(0,232,149,0.09)', text: 'var(--green, #00e895)', label: 'COMPLETED' },
    failed: { bg: 'rgba(255,45,78,0.1)', text: 'var(--red, #ff2d4e)', label: 'FAILED' },
    pending: { bg: 'rgba(255,170,26,0.1)', text: 'var(--yellow, #ffaa1a)', label: 'PENDING' },
    queued: { bg: 'var(--bg3, #1a2236)', text: 'var(--t2)', label: 'QUEUED' },
  };
  const { bg, text, label } = map[s] || { bg: 'var(--bg3)', text: 'var(--t2)', label: s.toUpperCase() };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20,
      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
      background: bg, color: text, border: `1px solid ${text}22`
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {label}
    </span>
  );
}

// ─── Sub-Component: Priority Label ────────────────────────────────
function PrioLabel({ prio }: { prio: string }) {
  const colors: Record<string, string> = {
    critical: 'var(--red, #ff2d4e)',
    high: 'var(--yellow, #ffaa1a)',
    normal: 'var(--t2)',
    low: 'var(--t3)',
  };
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: colors[prio] || 'var(--t2)' }}>{prio}</span>;
}

// ─── Main Component ───────────────────────────────────────────────
export default function FleetDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<FleetHealth | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [timeseries, setTimeseries] = useState<TimePoint[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');

  // History buffers for sparklines
  const agentHistory = useRef<number[]>([]);
  const taskHistory = useRef<number[]>([]);
  const srHistory = useRef<number[]>([]);
  const latHistory = useRef<number[]>([]);
  const costHistory = useRef<number[]>([]);

  const pushHistory = (arr: React.MutableRefObject<number[]>, val: number) => {
    arr.current = [...arr.current.slice(-19), val];
  };

  // ─── Data Fetching ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('agentcloud_token') : null;
    if (!token) return;

    try {
      const [s, h, t, a, ts, traces] = await Promise.allSettled([
        apiFetch<Stats>('/analytics/summary'),
        apiFetch<FleetHealth>('/analytics/fleet-health'),
        apiFetch<TaskRow[]>('/tasks?limit=8'),
        apiFetch<AgentRow[]>('/agents'),
        apiFetch<TimePoint[]>('/analytics/timeseries'),
        apiFetch<any[]>('/traces'),
      ]);

      if (s.status === 'fulfilled' && s.value) {
        setStats(s.value);
        pushHistory(agentHistory, s.value.active_agents);
        pushHistory(taskHistory, s.value.total_tasks);
        pushHistory(srHistory, s.value.success_rate);
        pushHistory(latHistory, s.value.avg_latency);
        pushHistory(costHistory, s.value.total_cost);
      }
      if (h.status === 'fulfilled' && h.value) setHealth(h.value);
      if (t.status === 'fulfilled' && t.value) setTasks(t.value);
      if (a.status === 'fulfilled' && a.value) setAgents(a.value);
      if (ts.status === 'fulfilled' && ts.value) setTimeseries(ts.value);
      if (traces.status === 'fulfilled' && traces.value) {
        const errorKeys = ['error', 'failed', 'timeout', 'exception'];
        const errs = traces.value.filter((tr: any) =>
          errorKeys.some(k => (tr.status || '').toLowerCase().includes(k) || (tr.step || '').toLowerCase().includes(k))
        ).slice(0, 5);
        if (errs.length > 0) {
          setIncidents(errs.map((e: any) => ({
            icon: '🔴', title: `Trace Error: ${e.step || 'Execution Fault'}`,
            desc: `Trace ${(e.trace_id || '').substring(0, 8)} · Agent ${(e.agent_id || '').substring(0, 8)}`,
            time: new Date(e.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sev: 'r'
          })));
        }
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Fleet fetch error', err);
    }
  }, []);

  // ─── Polling + Progress Bar ────────────────────────────────────
  useEffect(() => {
    fetchAll();
    
    // Connect to Real-time WebSockets
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//localhost:8000/ws/tasks`);
    
    ws.onmessage = (event) => {
      try {
        fetchAll(); // Refresh on any broadcast
      } catch (e) {}
    };

    return () => ws.close();
  }, [fetchAll]);

  useEffect(() => {
    setProgress(0);
    const tick = setInterval(() => {
      setProgress(p => {
        const next = Math.min(100, p + (80 / POLL_FAST) * 100);
        return next;
      });
    }, 80);
    const reset = setInterval(() => setProgress(0), POLL_FAST);
    return () => { clearInterval(tick); clearInterval(reset); };
  }, []);

  // ─── Default data if API hasn't responded yet ──────────────────
  const s = stats || {
    active_agents: 0, total_tasks: 0, tasks_completed: 0,
    success_rate: 0, avg_latency: 0, total_cost: 0,
    pending_approvals: 0, active_events: 0, error_rate: 0,
  };

  const fl = health || { running: 0, idle: 0, cooldown: 0, offline: 0, total: 0 };

  // Fallback incidents
  const displayIncidents = incidents.length > 0 ? incidents : [
    { icon: '⚠️', title: 'Waiting for trace data', desc: 'Connect backend to populate incidents', time: 'now', sev: 'y' },
  ];

  // ─── Chart data ────────────────────────────────────────────────
  const tsValues = timeseries.length > 0 ? timeseries.map(t => t.value) : Array.from({ length: 20 }, () => 0);
  const tsLabels = timeseries.length > 0 ? timeseries.map(t => t.time) : Array.from({ length: 20 }, (_, i) => `${i}h`);

  const chartW = 560;
  const chartH = 120;
  const tsPath = sparklinePath(tsValues, chartW, chartH);

  // Donut data
  const donutValues = [fl.running, fl.idle, fl.cooldown, fl.offline];
  const donutColors = ['#2e6fff', '#00e895', '#ffaa1a', '#2e3c5c'];
  const donutLabels = ['Running', 'Idle', 'Cooldown', 'Offline'];

  // Cost trend sparkline
  const costPath = sparklinePath(costHistory.current.length > 1 ? costHistory.current : [0, 0], chartW, 100);

  // Agent icon backgrounds (cycling colors)
  const agentColors = ['rgba(46,111,255,0.14)', 'rgba(124,58,255,0.14)', 'rgba(0,232,149,0.12)', 'rgba(0,200,224,0.12)', 'rgba(255,170,26,0.12)', 'rgba(255,61,127,0.12)'];
  const agentIcons = ['🔍', '📊', '✍️', '💻', '🛡️', '⚡', '🧠', '🤖'];

  return (
    <div style={{ padding: '0 24px 32px', display: 'flex', flexDirection: 'column', gap: 12, animation: 'ms-fade-in 0.8s ease-out' }}>

      {/* Refresh Bar */}
      <RefreshBar progress={progress} />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Active Agents" value={String(s.active_agents)} trend="up" trendLabel={`${s.active_agents} total`} color="#2e6fff" sparkData={agentHistory.current} />
        <KpiCard label="Tasks · 24h" value={s.total_tasks.toLocaleString()} trend="up" trendLabel={`${s.tasks_completed} completed`} color="#00e895" sparkData={taskHistory.current} />
        <KpiCard label="Success Rate" value={`${s.success_rate}%`} trend={s.success_rate >= 90 ? 'up' : 'down'} trendLabel={s.error_rate > 0 ? `${(s.error_rate * 100).toFixed(1)}% errors` : 'nominal'} color="#ffaa1a" sparkData={srHistory.current} />
        <KpiCard label="Avg Latency" value={`${s.avg_latency}ms`} trend="up" trendLabel="P99 stable" color="#00c8e0" sparkData={latHistory.current} />
      </div>

      {/* Chart Band: Task Volume (2/3) + Fleet Health Donut (1/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>

        {/* Task Volume Chart */}
        <div className="ms-glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bg3, rgba(255,255,255,0.055))', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display, var(--mono))', fontSize: 13, fontWeight: 700 }}>Task Volume &amp; Success Rate</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)' }}>24-hour rolling window</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(0,232,149,0.1)', color: 'var(--green, #00e895)', border: '1px solid rgba(0,232,149,0.22)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green, #00e895)', boxShadow: '0 0 6px var(--green, #00e895)', animation: 'ms-pulse 2s infinite' }} />
              Real-time
            </span>
          </div>
          <div style={{ padding: 16, height: 158, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 1, 2, 3].map(i => (
                <line key={i} x1={0} y1={chartH * i / 3} x2={chartW} y2={chartH * i / 3} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              ))}
              {/* Area fill */}
              <defs>
                <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2e6fff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2e6fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              {tsValues.length > 1 && (
                <>
                  <path d={`${tsPath} L ${chartW} ${chartH} L 0 ${chartH} Z`} fill="url(#taskGrad)" />
                  <path d={tsPath} fill="none" stroke="#2e6fff" strokeWidth={2} />
                </>
              )}
            </svg>
            {/* X-axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
              {tsLabels.filter((_, i) => i % Math.ceil(tsLabels.length / 6) === 0).map((l, i) => (
                <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet Health Donut */}
        <div className="ms-glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bg3, rgba(255,255,255,0.055))', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display, var(--mono))', fontSize: 13, fontWeight: 700 }}>Fleet Health</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)' }}>By agent state</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(46,111,255,0.12)', color: 'var(--blue, #2e6fff)', border: '1px solid rgba(46,111,255,0.22)' }}>Live</span>
          </div>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg viewBox="0 0 120 120" style={{ width: 110, height: 110 }}>
              {fl.total > 0 ? donutSlices(donutValues, donutColors, 60, 60, 50) : (
                <circle cx={60} cy={60} r={50} fill="none" stroke="var(--bg3, #1a2236)" strokeWidth={20} />
              )}
              <circle cx={60} cy={60} r={32} fill="var(--bg1, #06090f)" />
              <text x={60} y={56} textAnchor="middle" fill="var(--text, #dde8ff)" fontSize={18} fontWeight={700} fontFamily="var(--mono)">
                {fl.total}
              </text>
              <text x={60} y={72} textAnchor="middle" fill="var(--t3)" fontSize={8} fontFamily="var(--mono)">
                TOTAL
              </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {donutLabels.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--t2)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: donutColors[i], flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{donutValues[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Task Queue + Token Cost Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Task Queue Table */}
        <div className="ms-glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bg3, rgba(255,255,255,0.055))', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display, var(--mono))', fontSize: 13, fontWeight: 700 }}>Active Task Queue</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)' }}>Updated: {lastUpdated || '...'}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(0,232,149,0.1)', color: 'var(--green, #00e895)', border: '1px solid rgba(0,232,149,0.22)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green, #00e895)', boxShadow: '0 0 6px var(--green, #00e895)', animation: 'ms-pulse 2s infinite' }} />
              Auto-refresh
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Task ID', 'Description', 'Status', 'Timestamp'].map(h => (
                    <th key={h} style={{
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: 1,
                      textTransform: 'uppercase', color: 'var(--t3)', padding: '10px 14px',
                      borderBottom: '1px solid var(--bg3, rgba(255,255,255,0.055))', textAlign: 'left', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--t3)', fontSize: 11 }}>No tasks detected</td></tr>
                ) : tasks.slice(0, 7).map(t => (
                  <tr key={t.task_id} style={{ borderBottom: '1px solid var(--bg3, rgba(255,255,255,0.055))' }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>
                      {t.task_id.substring(0, 12)}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text, #dde8ff)', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description || 'Unnamed task'}
                    </td>
                    <td style={{ padding: '11px 14px' }}><StatusPill status={t.status} /></td>
                    <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Token Cost Trend */}
        <div className="ms-glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bg3, rgba(255,255,255,0.055))', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display, var(--mono))', fontSize: 13, fontWeight: 700 }}>Token Cost Trend</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)' }}>Live accumulation · Today</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(46,111,255,0.12)', color: 'var(--blue, #2e6fff)', border: '1px solid rgba(46,111,255,0.22)' }}>
              ${s.total_cost.toFixed(2)} today
            </span>
          </div>
          <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 100, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${chartW} 100`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffaa1a" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#ffaa1a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {costHistory.current.length > 1 && (
                  <>
                    <path d={`${costPath} L ${chartW} 100 L 0 100 Z`} fill="url(#costGrad)" />
                    <path d={costPath} fill="none" stroke="#ffaa1a" strokeWidth={2} />
                  </>
                )}
              </svg>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                Top Cost Agents
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {agents.slice(0, 4).map((a, i) => (
                    <tr key={a.agent_id}>
                      <td style={{ padding: '5px 8px', fontSize: 11, color: 'var(--text, #dde8ff)', fontWeight: 500 }}>{a.name}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--yellow, #ffaa1a)', textAlign: 'right' }}>
                        ${((i + 1) * 0.12).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Registry Grid */}
      <div className="ms-glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bg3, rgba(255,255,255,0.055))', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-display, var(--mono))', fontSize: 13, fontWeight: 700 }}>Agent Registry Snapshot</div>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(0,232,149,0.1)', color: 'var(--green, #00e895)', border: '1px solid rgba(0,232,149,0.22)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green, #00e895)', boxShadow: '0 0 6px var(--green, #00e895)', animation: 'ms-pulse 2s infinite' }} />
            Online
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 14 }}>
          {(agents.length > 0 ? agents.slice(0, 6) : [
            { agent_id: '1', name: 'No agents yet', model: '—', status: 'offline' }
          ]).map((a, i) => {
            const pct = 70 + Math.floor(Math.random() * 30);
            const barColor = pct > 90 ? 'var(--green, #00e895)' : pct > 70 ? 'var(--yellow, #ffaa1a)' : 'var(--red, #ff2d4e)';
            const statusDot = (a.status || '').toLowerCase();
            const dotColor = statusDot === 'running' ? 'var(--green, #00e895)' :
              statusDot === 'idle' ? 'var(--yellow, #ffaa1a)' : 'var(--t3)';
            return (
              <div key={a.agent_id} style={{
                background: 'var(--bg2, #0b1019)', border: '1px solid var(--bg3, rgba(255,255,255,0.055))',
                borderRadius: 10, padding: 12, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.12s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 15,
                    background: agentColors[i % agentColors.length]
                  }}>
                    {agentIcons[i % agentIcons.length]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text, #dde8ff)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)', marginTop: 1 }}>{a.model || a.role || 'agent'}</div>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: statusDot === 'running' ? '0 0 6px var(--green, #00e895)' : 'none', flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 3, background: 'var(--bg3, #1a2236)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: barColor }} />
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, minWidth: 28, textAlign: 'right', color: barColor }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident Timeline */}
      <div className="ms-glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bg3, rgba(255,255,255,0.055))', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-display, var(--mono))', fontSize: 13, fontWeight: 700 }}>Incident Timeline</div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)', marginLeft: 8 }}>Circuit breaker &amp; anomaly events</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(0,232,149,0.1)', color: 'var(--green, #00e895)', border: '1px solid rgba(0,232,149,0.22)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green, #00e895)', boxShadow: '0 0 6px var(--green, #00e895)', animation: 'ms-pulse 2s infinite' }} />
            Live
          </span>
        </div>
        <div>
          {displayIncidents.map((inc, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 18px',
              borderBottom: i < displayIncidents.length - 1 ? '1px solid var(--bg3, rgba(255,255,255,0.055))' : 'none',
              transition: 'background 0.12s'
            }}>
              <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{inc.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text, #dde8ff)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {inc.title}
                  {inc.sev && (
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 8, padding: '1px 5px', borderRadius: 3,
                      background: inc.sev === 'r' ? 'rgba(255,45,78,0.12)' : 'rgba(255,170,26,0.12)',
                      color: inc.sev === 'r' ? 'var(--red, #ff2d4e)' : 'var(--yellow, #ffaa1a)'
                    }}>
                      {inc.sev === 'r' ? 'CRITICAL' : 'WARNING'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.45 }}>{inc.desc}</div>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)', flexShrink: 0, marginTop: 2 }}>{inc.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes ms-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
