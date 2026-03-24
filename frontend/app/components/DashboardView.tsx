'use client';

import React, { useState, useEffect } from 'react';
import { Users, Activity, AlertCircle, DollarSign, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function DashboardView() {
  const [metrics, setMetrics] = useState({
    active_agents: 7,
    tasks_completed: 1847,
    error_rate: 0.021,
    api_cost: 14.82,
    avg_latency: 1400
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        if (data) setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const KPI_DATA = [
    { label: 'Active Agents', val: metrics.active_agents, ic: <Users size={20} />, col: '#5b8cff', up: true, d: '+2' },
    { label: 'Tasks Completed', val: metrics.tasks_completed.toLocaleString(), ic: <Activity size={20} />, col: '#22d3a0', up: true, d: '18.4%' },
    { label: 'Error Rate', val: `${(metrics.error_rate * 100).toFixed(1)}%`, ic: <AlertCircle size={20} />, col: '#f94f6a', up: false, d: '0.6%' },
    { label: 'API Cost (7d)', val: `$${metrics.api_cost.toFixed(2)}`, ic: <DollarSign size={20} />, col: '#f59e0b', up: true, d: '+$2.40' },
    { label: 'Avg Latency', val: `${metrics.avg_latency}ms`, ic: <Clock size={20} />, col: '#22d3ee', up: false, d: '0.2s' },
  ];

  const events = [
    { msg: 'Task tsk-8841 completed — quality score 0.94', agent: 'DataAnalyst', t: '2m ago', type: 'ok', dot: 'dot-g' },
    { msg: 'Circuit breaker OPEN for ag-006 (3 failures)', agent: 'SecurityGuardian', t: '3m ago', type: 'warn', dot: 'dot-y' },
    { msg: 'Agent WebResearcher seeded to DB', agent: 'System', t: '4m ago', type: 'info', dot: 'dot-b' },
    { msg: 'Task tsk-8846 failed — sent to DLQ', agent: 'SecurityGuardian', t: '8m ago', type: 'err', dot: 'dot-r' },
    { msg: 'Reputation decay cycle ran — 7 agents updated', agent: 'Orchestrator', t: '10m ago', type: 'info', dot: 'dot-b' },
  ];

  const recentTasks = [
    { id: 'tsk-8841', desc: 'Analyze Q1 sales data...', agent: 'DataAnalyst', status: 'completed', dur: '8.4s' },
    { id: 'tsk-8842', desc: 'Write blog post about AI...', agent: 'ContentWriter', status: 'running', dur: '—' },
    { id: 'tsk-8843', desc: 'Debug JWT authentication...', agent: 'CodeHelper', status: 'running', dur: '—' },
    { id: 'tsk-8844', desc: 'Research competitor pricing...', agent: 'WebResearcher', status: 'pending', dur: '—' },
  ];

  if (loading) return <div className="view-body p-8 mono text-t3 animate-pulse">Synchronizing with Orchestrator...</div>;

  return (
    <div className="view-body" style={{ padding: '24px 28px' }}>
      <div className="kpi-row">
        {KPI_DATA.map((k, i) => (
          <div className="kpi" key={i} style={{ '--kc': k.col } as any}>
            <div className="kpi-ico" style={{ color: k.col }}>{k.ic}</div>
            <div className="kpi-lbl">{k.label}</div>
            <div className="kpi-val">{k.val}</div>
            <div className={`kpi-delta ${k.up ? 'up' : 'dn'}`}>
              {k.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {k.d}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* THROUGHPUT CHART */}
        <div className="card lg:col-span-2">
          <div className="card-hd">
            <div>
              <div className="card-hd-title capitalize">Task Throughput</div>
              <div className="card-hd-sub">Completions per hour · last 24h</div>
            </div>
            <div className="pill"><span className="dot dot-g"></span>Live</div>
          </div>
          <div className="card-body">
            <div className="spark-row flex items-end gap-[3px] h-[60px]">
              {[8,14,7,22,28,31,18,42,40,45,38,52,50,33,27,36,46,54,40,30,20,24,16,10].map((v, i) => (
                <div 
                  key={i} 
                  className="spark-bar flex-1 bg-gradient-to-t from-[var(--a2)] to-[var(--a)] rounded-t-sm"
                  style={{ height: `${(v / 54) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3 text-[10px] mono text-t3 uppercase font-bold tracking-widest px-1">
               <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>24h</span>
            </div>
          </div>
        </div>

        {/* EVENT STREAM */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-title uppercase">Event Stream</div>
            <div className="pill"><span className="dot dot-b dot-pulse"></span>Live</div>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {events.map((e, i) => (
              <div key={i} className="flex items-start gap-3 p-3 px-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className={`dot ${e.dot} mt-1.5 shrink-0`}></div>
                <div className="flex-1">
                  <div className="text-[12px] leading-snug">{e.msg}</div>
                  <div className="text-[10px] text-t3 mono mt-1">{e.agent}</div>
                </div>
                <div className="text-[10px] text-t3 mono shrink-0">{e.t}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RECENT TASKS */}
      <div className="card tbl-wrap">
        <div className="card-hd">
          <div className="card-hd-title uppercase">Recent Tasks</div>
          <button className="btn btn-g btn-sm text-[10px] uppercase font-bold tracking-widest px-3">View All →</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Description</th>
              <th>Agent</th>
              <th>Status</th>
              <th className="text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {recentTasks.map((t, i) => (
              <tr key={i}>
                <td className="mono-sm">{t.id}</td>
                <td className="text-[12px]">{t.desc}</td>
                <td className="text-[12px] text-t2">{t.agent}</td>
                <td>
                  <span className={`badge ${t.status === 'completed' ? 'b-g' : 'b-a'}`}>
                    {t.status.toUpperCase()}
                  </span>
                </td>
                <td className="mono-sm text-right">{t.dur}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
