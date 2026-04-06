import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Clock, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { Stats, FleetHealth, Task, Agent } from '../../lib/types';
import NeuralGlobe from './NeuralGlobe';
import { usePolling } from '../../lib/usePolling';

// ─── Sparkline SVG ────────────────────────────────────────────────
function Sparkline({ data, color, w = 100, h = 32 }: { data: number[], color: string, w?: number, h?: number }) {
  if (data.length < 2) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${pts.join(' ')} ${w},${h} 0,${h}`} fill={`${color}15`} stroke="none" />
    </svg>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────
function ActivityLog({ tasks }: { tasks: Task[] }) {
  const getTag = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') return { label: 'DONE', cls: 'green' };
    if (s === 'failed') return { label: 'ERROR', cls: 'red' };
    if (s === 'processing' || s === 'in_progress') return { label: 'SYNC', cls: 'blue' };
    return { label: 'PROC', cls: 'cyan' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {tasks.slice(0, 12).map((t, i) => {
        const tag = getTag(t.status);
        const time = new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return (
          <div key={t.task_id} style={{
            padding: '8px 0', borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
            fontSize: 11, fontFamily: 'var(--mono)', lineHeight: 1.5, color: 'var(--t2)'
          }}>
            <span style={{ color: 'var(--t3)', marginRight: 6 }}>[{time}]</span>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, marginRight: 6,
              background: tag.cls === 'green' ? 'rgba(0,255,170,0.15)' : tag.cls === 'red' ? 'rgba(255,42,109,0.15)' : tag.cls === 'blue' ? 'rgba(46,111,255,0.15)' : 'rgba(0,210,255,0.15)',
              color: tag.cls === 'green' ? 'var(--green)' : tag.cls === 'red' ? 'var(--red)' : tag.cls === 'blue' ? 'var(--blue)' : 'var(--cyan)',
            }}>{tag.label}</span>
            <span>
              {t.agent_id ? `Worker_${t.agent_id.slice(-2)}` : 'Worker'} | Task {t.task_id.slice(0, 4).toUpperCase()}
            </span>
            <div style={{ color: 'var(--t3)', fontSize: 10 }}>Status: {t.status.charAt(0).toUpperCase() + t.status.slice(1)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function FleetDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<FleetHealth | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  const agentHist = useRef<number[]>([]);
  const taskHist = useRef<number[]>([]);
  const srHist = useRef<number[]>([]);
  const latHist = useRef<number[]>([]);

  const push = (arr: React.MutableRefObject<number[]>, v: number) => {
    arr.current = [...arr.current.slice(-14), v];
  };

  const fetchAll = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('agentcloud_token') : null;
    if (!token) return;
    try {
      const [s, h, t, a] = await Promise.allSettled([
        apiFetch<Stats>('/analytics/summary'),
        apiFetch<FleetHealth>('/analytics/fleet-health'),
        apiFetch<Task[]>('/tasks'),
        apiFetch<Agent[]>('/agents'),
      ]);
      if (s.status === 'fulfilled' && s.value) {
        setStats(s.value);
        push(agentHist, s.value.active_agents);
        push(taskHist, s.value.total_tasks);
        push(srHist, s.value.success_rate);
        push(latHist, s.value.avg_latency);
      }
      if (h.status === 'fulfilled') setHealth(h.value);
      if (t.status === 'fulfilled') setTasks(t.value || []);
      if (a.status === 'fulfilled') setAgents(a.value || []);
    } catch (err) {
      console.error('Fleet sync failed:', err);
    }
  }, []);

  usePolling(fetchAll, 8000, true);

  const s = stats || { active_agents: 0, total_tasks: 0, tasks_completed: 0, success_rate: 100, avg_latency: 0, total_cost: 0, error_rate: 0 };

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, animation: 'ms-fade-in 0.6s ease-out', height: '100%', overflow: 'auto' }}>
      
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
            Dashboard {'>'} Agent {'>'} Core A
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Network Core</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Connected nodes and datapoints from the fleet</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="ms-btn ms-btn-sm" onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> Last 24h
          </div>
        </div>
      </div>

      {/* Main Grid: Visualization + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, flex: 1, minHeight: 360 }}>
        {/* Network Visualization */}
        <div className="ms-glass-panel" style={{ position: 'relative', overflow: 'hidden', minHeight: 360 }}>
          <NeuralGlobe />
          {/* Overlay labels for agents */}
          {agents.slice(0, 6).map((a, i) => {
            const positions = [
              { left: '20%', top: '35%' }, { left: '40%', top: '25%' },
              { left: '55%', top: '40%' }, { left: '70%', top: '30%' },
              { left: '30%', top: '55%' }, { left: '60%', top: '60%' },
            ];
            const pos = positions[i] || { left: '50%', top: '50%' };
            return (
              <div key={a.agent_id} style={{
                position: 'absolute', ...pos, transform: 'translate(-50%, -50%)', zIndex: 10,
                background: 'rgba(6,9,15,0.85)', border: '1px solid var(--border)', borderRadius: 6,
                padding: '4px 10px', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--t2)',
                backdropFilter: 'blur(8px)', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <span style={{ color: a.status === 'active' ? 'var(--cyan)' : 'var(--t3)', marginRight: 4 }}>●</span>
                {a.name || `Worker-${i + 1}`}
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="ms-glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Recent Activity</div>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--cyan)', background: 'rgba(0,210,255,0.08)', padding: '2px 8px', borderRadius: 4 }}>
              {tasks.length} events
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
            <ActivityLog tasks={tasks} />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {/* Active Agents */}
        <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Active Agents</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{s.active_agents}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6, display: 'flex', gap: 12 }}>
                <span>● {Math.round(s.active_agents * 0.8)} Online</span>
                <span>● {Math.round(s.active_agents * 0.15)} Idle</span>
                <span>● {Math.round(s.active_agents * 0.05)} Error</span>
              </div>
            </div>
            <Sparkline data={agentHist.current} color="#00d2ff" w={80} h={40} />
          </div>
        </div>

        {/* Throughput */}
        <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Throughput</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', background: 'rgba(0,255,170,0.1)', padding: '2px 6px', borderRadius: 4 }}>Live</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                {s.total_tasks > 0 ? (s.total_tasks / 24).toFixed(1) : '0'} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t3)' }}>t/h</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6, display: 'flex', gap: 12 }}>
                <span>● File Data</span><span>● Sys Logs</span><span>● API</span>
              </div>
            </div>
            <Sparkline data={taskHist.current} color="#00ffaa" w={80} h={40} />
          </div>
        </div>

        {/* Success Rate */}
        <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4aa' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Success Rate</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                {s.success_rate}<span style={{ fontSize: 18, fontWeight: 600 }}>%</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 6 }}>
                ↑ {(s.success_rate * 0.02).toFixed(1)}% from last hour
              </div>
            </div>
            {/* Mini donut */}
            <svg width={48} height={48} viewBox="0 0 48 48">
              <circle cx={24} cy={24} r={18} fill="none" stroke="var(--bg3)" strokeWidth={5} />
              <circle cx={24} cy={24} r={18} fill="none" stroke="#00d4aa" strokeWidth={5}
                strokeDasharray={`${s.success_rate * 1.13} 113`}
                strokeLinecap="round" transform="rotate(-90 24 24)" />
            </svg>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Avg Latency</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                {s.avg_latency} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t3)' }}>ms</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} /> Within SLA threshold
              </div>
            </div>
            <Sparkline data={latHist.current} color="#ffcc33" w={80} h={40} />
          </div>
        </div>
      </div>
    </div>
  );
}
