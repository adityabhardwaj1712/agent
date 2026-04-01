'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';

/* ═══════════════════════════════════════════════════
   FLEET VIEW — Agent Cards Grid
═══════════════════════════════════════════════════ */

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  cpu: number;
  mem: number;
  tasks: number;
  model: string;
  uptime: string;
}

function seedAgents(): Agent[] {
  const roles = ['Worker', 'Core', 'Storage', 'Analytics'];
  const statuses = ['Online', 'Online', 'Online', 'Online', 'Degraded', 'Offline'];
  const models = ['claude-sonnet-4-6', 'claude-opus-4-6', 'gpt-4o', 'claude-haiku-4-5'];
  return Array.from({ length: 16 }, (_, i) => ({
    id: `AGT-${String(i + 1).padStart(3, '0')}`,
    name: i < 3 ? `Core-${String.fromCharCode(65 + i)}` : i < 12 ? `Worker-${i - 2}` : i < 14 ? `Storage-${i - 11}` : `Analytics-${i - 13}`,
    role: i < 3 ? 'Core' : i < 12 ? 'Worker' : i < 14 ? 'Storage' : 'Analytics',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    cpu: Math.floor(Math.random() * 85) + 10,
    mem: Math.floor(Math.random() * 80) + 15,
    tasks: Math.floor(Math.random() * 20),
    model: models[i % models.length],
    uptime: (Math.random() * 99 + 0.5).toFixed(2),
  }));
}

function AgentCard({ agent }: { agent: Agent }) {
  const colors: Record<string, string> = { Core: 'var(--blue)', Worker: 'var(--purple)', Storage: 'var(--orange)', Analytics: 'var(--cyan)' };
  const color = colors[agent.role] || 'var(--t2)';
  const stCls = agent.status === 'Online' ? 'pill-green' : agent.status === 'Degraded' ? 'pill-orange' : 'pill-red';

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    c.width = c.offsetWidth || 200;
    c.height = 32;
    const data = Array.from({ length: 12 }, () => Math.random() * 60 + 20);
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * c.width,
      y: 28 - ((v - min) / range) * 24,
    }));
    const rawColor = color.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(color.replace('var(', '').replace(')', '')).trim() : color;
    const grad = ctx.createLinearGradient(0, 0, 0, 32);
    grad.addColorStop(0, (rawColor || '#00b4f0') + '44');
    grad.addColorStop(1, (rawColor || '#00b4f0') + '00');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(c.width, 32);
    ctx.lineTo(0, 32);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = rawColor || '#00b4f0';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [color]);

  return (
    <div className="agent-card">
      <div className="agent-head">
        <div className="agent-icon" style={{ background: `${color}20`, color }}>🤖</div>
        <span className={`pill ${stCls}`}>{agent.status}</span>
      </div>
      <div className="agent-name">{agent.name}</div>
      <div className="agent-id">{agent.id}</div>
      <div className="spk-wrap">
        <canvas ref={canvasRef} style={{ width: '100%', height: 32 }} />
      </div>
      <div className="agent-metrics">
        <div className="agent-metric">
          <div className="agent-metric-val" style={{ color }}>{agent.cpu}%</div>
          <div className="agent-metric-lbl">CPU</div>
        </div>
        <div className="agent-metric">
          <div className="agent-metric-val" style={{ color }}>{agent.mem}%</div>
          <div className="agent-metric-lbl">MEM</div>
        </div>
        <div className="agent-metric">
          <div className="agent-metric-val" style={{ color }}>{agent.tasks}</div>
          <div className="agent-metric-lbl">Tasks</div>
        </div>
      </div>
    </div>
  );
}

export default function FleetView() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Try to fetch real agents, fallback to seed data
    const load = async () => {
      try {
        const data = await apiFetch<any[]>('/agents/');
        if (data && data.length > 0) {
          setAgents(data.map((a: any) => ({
            id: a.agent_id?.slice(0, 7) || a.id || 'AGT-???',
            name: a.name || 'Agent',
            role: a.role || 'Worker',
            status: a.status === 'active' ? 'Online' : a.status === 'degraded' ? 'Degraded' : 'Offline',
            cpu: Math.floor(Math.random() * 85) + 10,
            mem: Math.floor(Math.random() * 80) + 15,
            tasks: a.tasks_processed || Math.floor(Math.random() * 20),
            model: a.model || 'claude-sonnet-4-6',
            uptime: '99.9',
          })));
        } else {
          setAgents(seedAgents());
        }
      } catch {
        setAgents(seedAgents());
      }
    };
    load();
  }, []);

  const filtered = agents.filter(a => {
    const matchRole = filter === 'All' || a.role === filter;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="view-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="pg-title">Agent Fleet</h1>
          <div className="pg-sub">{agents.length} agents across 3 cores</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 7,
              padding: '7px 12px', color: 'var(--text)', fontFamily: 'var(--sans)',
              fontSize: 12, outline: 'none', width: 200,
            }}
          />
          {['All', 'Core', 'Worker', 'Storage'].map(r => (
            <button key={r} className={`btn btn-ghost btn-sm ${filter === r ? '' : ''}`}
              style={filter === r ? { borderColor: 'var(--blue)', color: 'var(--blue)' } : {}}
              onClick={() => setFilter(r)}>
              {r}
            </button>
          ))}
          <button className="btn btn-primary btn-sm" onClick={() => (window as any).openAddAgent?.()}>
            + Deploy Agent
          </button>
        </div>
      </div>
      <div className="agent-grid">
        {filtered.map(a => <AgentCard key={a.id} agent={a} />)}
      </div>
    </div>
  );
}
