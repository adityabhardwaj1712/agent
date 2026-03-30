'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, Cpu, Shield, Zap, Clock, Search, Bell, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, MoreHorizontal, TrendingUp
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Stats, FleetHealth, Task, Agent, TimePoint } from '../lib/types';
import StatusPill from './StatusPill';
import KpiCard from './KpiCard';
import ProgressBar from './ProgressBar';
import NeuralGlobe from './NeuralGlobe';

// ─── Constants ────────────────────────────────────────────────────
const POLL_FAST = 4000;
const POLL_SLOW = 10000;

// ─── Helpers ──────────────────────────────────────────────────────
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

// ─── Main Component ───────────────────────────────────────────────
export default function FleetDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<FleetHealth | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [timeseries, setTimeseries] = useState<TimePoint[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');

  const agentHistory = useRef<number[]>([]);
  const taskHistory = useRef<number[]>([]);
  const srHistory = useRef<number[]>([]);
  const latHistory = useRef<number[]>([]);
  const costHistory = useRef<number[]>([]);

  const pushHistory = (arr: React.MutableRefObject<number[]>, val: number) => {
    arr.current = [...arr.current.slice(-19), val];
  };

  const fetchAll = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('agentcloud_token') : null;
    if (!token) return;

    try {
      const [s, h, t, a, ts, traces] = await Promise.allSettled([
        apiFetch<Stats>('/analytics/summary'),
        apiFetch<FleetHealth>('/analytics/fleet-health'),
        apiFetch<Task[]>('/tasks'),
        apiFetch<Agent[]>('/agents'),
        apiFetch<TimePoint[]>('/analytics/timeseries'),
        apiFetch<any[]>('/analytics/incidents')
      ]);

      if (s.status === 'fulfilled' && s.value) {
        setStats(s.value);
        pushHistory(agentHistory, s.value.active_agents);
        pushHistory(taskHistory, s.value.total_tasks);
        pushHistory(srHistory, s.value.success_rate);
        pushHistory(latHistory, s.value.avg_latency);
        pushHistory(costHistory, s.value.total_cost);
      }
      if (h.status === 'fulfilled') setHealth(h.value);
      if (t.status === 'fulfilled') setTasks(t.value || []);
      if (a.status === 'fulfilled') setAgents(a.value || []);
      if (ts.status === 'fulfilled') setTimeseries(ts.value || []);
      if (traces.status === 'fulfilled') setIncidents(traces.value || []);

      setLastUpdated(new Date().toLocaleTimeString());
      setProgress(0);
    } catch (err) {
      console.error('Fleet sync failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    
    // Real-time WebSocket using wsUrl utility
    const token = typeof window !== 'undefined' ? localStorage.getItem('agentcloud_token') : null;
    const { wsUrl } = require('../lib/api');
    const wsEndpoint = wsUrl(`/ws/fleet${token ? `?token=${token}` : ''}`);
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(wsEndpoint);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'task_update') {
            setTasks(prev => [data, ...prev.filter(t => t.task_id !== data.task_id)].slice(0, 10));
          } else if (data.type === 'stats_update') {
            setStats(prev => prev ? { ...prev, ...data.stats } : data.stats);
          }
        } catch (e) {}
      };
      ws.onclose = () => setTimeout(connect, 5000);
    };
    if (token) connect();

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { fetchAll(); return 0; }
        return prev + 1;
      });
    }, POLL_FAST / 100);
    
    return () => {
      clearInterval(timer);
      if (ws) ws.close();
    };
  }, [fetchAll]);

  const s = stats || { active_agents: 0, total_tasks: 0, tasks_completed: 0, success_rate: 100, avg_latency: 0, total_cost: 0, error_rate: 0 };
  const fl = health || { running: 0, idle: 0, cooldown: 0, offline: 0, total: 0 };
  const tsValues = timeseries.length > 0 ? timeseries.map(t => t.value) : Array.from({ length: 20 }, () => 0);
  const tsLabels = timeseries.length > 0 ? timeseries.map(t => t.time) : Array.from({ length: 20 }, (_, i) => `${i}h`);

  const donutValues = [fl.running, fl.idle, fl.cooldown, fl.offline];
  const donutColors = ['#2e6fff', '#10b981', '#f59e0b', '#334155'];
  const donutLabels = ['Running', 'Idle', 'Cooldown', 'Offline'];
  const agentColors = ['rgba(46,111,255,0.14)', 'rgba(124,58,255,0.14)', 'rgba(16,185,129,0.12)', 'rgba(6,182,212,0.12)', 'rgba(245,158,11,0.12)'];
  const agentIcons = ['🔍', '📊', '✍️', '💻', '🛡️', '⚡', '🧠', '🤖'];

  return (
    <div className="px-6 pb-8 flex flex-col gap-3 animate-ms-fade-in relative">
      <ProgressBar progress={progress} />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Active Agents" value={String(s.active_agents)} trend="up" trendLabel={`${s.active_agents} total`} color="#2e6fff" sparkData={agentHistory.current} />
        <KpiCard label="Tasks · 24h" value={s.total_tasks.toLocaleString()} trend="up" trendLabel={`${s.tasks_completed} done`} color="#10b981" sparkData={taskHistory.current} />
        <KpiCard label="Success Rate" value={`${s.success_rate}%`} trend={s.success_rate >= 90 ? 'up' : 'down'} trendLabel={s.error_rate > 0 ? `${(s.error_rate * 100).toFixed(1)}% err` : 'stable'} color="#f59e0b" sparkData={srHistory.current} />
        <KpiCard label="Avg Latency" value={`${s.avg_latency}ms`} trend="up" trendLabel="P99 stable" color="#06b6d4" sparkData={latHistory.current} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Neural Globe Visualization */}
        <div className="ms-glass-panel lg:col-span-2 overflow-hidden h-[300px] relative group">
          <div className="absolute top-4 left-4 z-10">
            <div className="text-[13px] font-bold text-white/80">GLOBAL_NEURAL_FLEET</div>
            <div className="font-mono text-[9px] text-[#64748b]">Active mission telemetry visualization</div>
          </div>
          <NeuralGlobe />
          <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1">
             <div className="text-[10px] font-mono text-emerald-400">ENCRYPTION: AES-256</div>
             <div className="text-[10px] font-mono text-[#2e6fff]">LATENCY: {s.avg_latency}ms</div>
          </div>
        </div>

        {/* Fleet Health Donut */}
        <div className="ms-glass-panel overflow-hidden">
          <div className="p-4 border-b border-[#ffffff0e] flex items-center justify-between">
             <div className="text-[13px] font-bold">Fleet Topology</div>
             <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold font-mono uppercase">Sync: OK</span>
          </div>
          <div className="p-4 flex items-center gap-4">
            <svg viewBox="0 0 120 120" className="w-24 h-24 shrink-0">
               {fl.total > 0 ? donutSlices(donutValues, donutColors, 60, 60, 50) : <circle cx={60} cy={60} r={50} fill="none" stroke="#1e293b" strokeWidth={15} />}
               <circle cx={60} cy={60} r={35} fill="#06090f" />
               <text x={60} y={62} textAnchor="middle" fill="#f8fafc" fontSize={16} fontWeight={800} className="font-mono uppercase">{fl.total}</text>
            </svg>
            <div className="flex flex-col gap-1.5 flex-1">
               {donutLabels.map((l, i) => (
                 <div key={l} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-[2px]" style={{ background: donutColors[i] }} />
                       <span className="text-[#94a3b8]">{l}</span>
                    </div>
                    <span className="font-bold font-mono text-[#cbd5e1]">{donutValues[i]}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
         {/* Task Queue */}
         <div className="ms-glass-panel overflow-hidden">
            <div className="p-4 border-b border-[#ffffff0e] font-bold text-[13px]">Mission Sequence Log</div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ffffff08] font-mono text-[9px] uppercase tracking-wider text-[#64748b]">
                       <th className="p-3">Sequence_ID</th>
                       <th className="p-3">Directive</th>
                       <th className="p-3">State</th>
                       <th className="p-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.slice(0, 6).map(t => (
                      <tr key={t.task_id} className="border-b border-[#ffffff05] hover:bg-white/[0.02]">
                         <td className="p-3 font-mono text-[10px] text-[#475569]">{t.task_id.substring(0, 12)}</td>
                         <td className="p-3 text-[12px] font-medium text-[#e2e8f0] truncate max-w-[180px]">{t.description || 'Anonymous Action'}</td>
                         <td className="p-3"><StatusPill status={t.status} /></td>
                         <td className="p-3 text-right font-mono text-[10px] text-[#475569]">{new Date(t.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Agents Snapshot */}
         <div className="ms-glass-panel overflow-hidden">
            <div className="p-4 border-b border-[#ffffff0e] font-bold text-[13px]">Active Multi-Agent Hub</div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
               {agents.slice(0, 6).map((a, i) => (
                 <div key={a.agent_id} className="bg-[#ffffff04] border border-[#ffffff08] rounded-lg p-3 hover:border-[#2e6fff44] transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: agentColors[i % agentColors.length] }}>
                          {agentIcons[i % agentIcons.length]}
                       </div>
                       <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold truncate text-[#f1f5f9]">{a.name}</div>
                          <div className="text-[9px] font-mono text-[#64748b] truncate uppercase">{a.model_name || a.role || 'Neural_Net'}</div>
                       </div>
                       <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-1 bg-[#1e293b] rounded-full overflow-hidden">
                          <div className="h-full bg-[#2e6fff] opacity-60" style={{ width: `${60 + (i * 7) % 35}%` }} />
                       </div>
                       <span className="font-mono text-[8px] text-[#475569] w-6">{60 + (i * 7) % 35}%</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
