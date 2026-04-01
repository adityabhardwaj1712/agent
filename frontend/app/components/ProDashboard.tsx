'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, getToken } from '../lib/api';

// ── Types ──
interface AgentSummary {
  agent_id: string;
  name: string;
  role: string;
  status: string;
}

interface TaskSummary {
  task_id: string;
  status: string;
  payload: string;
  created_at: string;
  agent_id?: string;
}

interface TraceEntry {
  trace_id: string;
  event_type: string;
  agent_id?: string;
  created_at: string;
  payload?: any;
}

// ── Sparkline helper ──
function drawSparkline(canvas: HTMLCanvasElement, data: number[], color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (data.length < 2) return;

  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (v / max) * h * 0.85
  }));

  // Fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '55');
  grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ── Donut helper ──
function drawDonut(canvas: HTMLCanvasElement, segments: { value: number; color: string }[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cx = 90, cy = 70, r = 50, ir = 32;
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;

  ctx.clearRect(0, 0, 180, 140);

  let angle = -Math.PI / 2;
  segments.forEach(d => {
    const sweep = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = d.color + 'aa';
    ctx.fill();
    angle += sweep;
  });

  // Inner cutout
  ctx.beginPath();
  ctx.arc(cx, cy, ir, 0, Math.PI * 2);
  ctx.fillStyle = '#0a1625';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 15px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.fillText(String(total), cx, cy + 5);
}

// ── Topology Canvas (Pseudo-3D) ──
function TopoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const spinRef = useRef(true);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // 3D Nodes: [x, y, z] in normalized -1 to 1 space
    const nodes3d = [
      { label: 'API Gateway', pos: [-0.9, 0, 0], color: '#00b4f0', r: 10 },
      { label: 'Core-Alpha', pos: [-0.4, -0.4, 0.3], color: '#00b4f0', r: 9 },
      { label: 'Core-Beta', pos: [-0.4, 0.4, -0.3], color: '#00b4f0', r: 9 },
      { label: 'Redis_Mesh', pos: [0.1, -0.6, 0.5], color: '#ef4444', r: 8 },
      { label: 'PG_Cluster', pos: [0.1, 0.6, -0.5], color: '#f59e0b', r: 12 },
      { label: 'Worker_01', pos: [0.6, -0.3, 0.4], color: '#00f5d4', r: 7 },
      { label: 'Worker_02', pos: [0.6, 0.2, 0], color: '#00f5d4', r: 7 },
      { label: 'Worker_03', pos: [0.6, 0.7, -0.4], color: '#00f5d4', r: 7 },
      { label: 'PG_Vector', pos: [0.2, 0, 0], color: '#8b5cf6', r: 9 },
      { label: 'Event_Bus', pos: [-0.1, 0.1, 0.1], color: '#8b5cf6', r: 8 },
    ];

    const edges = [
      [0, 1], [0, 2], [1, 3], [2, 4], [1, 9], [2, 9],
      [9, 5], [9, 6], [9, 7], [3, 5], [3, 6], [4, 8],
      [8, 5], [8, 6], [8, 7], [1, 4],
    ];

    const FOV = 400; // Field of view / Perspective strength

    function project(x: number, y: number, z: number, w: number, h: number) {
      // Perspective projection
      const scale = FOV / (FOV + z);
      const x2d = x * scale + w / 2;
      const y2d = y * scale + h / 2;
      return { x: x2d, y: y2d, scale };
    }

    function frame() {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (spinRef.current) angleRef.current += 0.005;
      const angle = angleRef.current;

      ctx.clearRect(0, 0, w, h);

      // Draw Grid / Floor for depth
      ctx.strokeStyle = 'rgba(0, 180, 240, 0.05)';
      ctx.lineWidth = 1;
      for (let i = -5; i <= 5; i++) {
         const p1 = project(i * 100, 100, -500, w, h);
         const p2 = project(i * 100, 100, 500, w, h);
         ctx.beginPath();
         ctx.moveTo(p1.x, p1.y);
         ctx.lineTo(p2.x, p2.y);
         ctx.stroke();
         
         const p3 = project(-500, 100, i * 100, w, h);
         const p4 = project(500, 100, i * 100, w, h);
         ctx.beginPath();
         ctx.moveTo(p3.x, p3.y);
         ctx.lineTo(p4.x, p4.y);
         ctx.stroke();
      }

      // Rotate nodes around Y axis
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const transformed = nodes3d.map(n => {
        const [nx, ny, nz] = n.pos;
        // Apply rotation
        const rx = nx * cos - nz * sin;
        const rz = nx * sin + nz * cos;
        
        // Final screen projection (scale up from normalized space)
        return {
          ...n,
          ...project(rx * (w * 0.35), ny * (h * 0.35), rz * 200, w, h),
          z: rz,
          rx, rz // Keep for reference if needed
        };
      });

      // Sort by Z for proper depth testing
      const sorted = [...transformed].sort((a, b) => b.z - a.z);

      // Edges (drawn first or sorted)
      edges.forEach(([a, b]) => {
        const na = transformed[a], nb = transformed[b];
        const g = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
        const alpha = Math.max(0.1, (na.scale + nb.scale) / 2 - 0.5);
        g.addColorStop(0, na.color + Math.floor(alpha * 120).toString(16).padStart(2, '0'));
        g.addColorStop(1, nb.color + Math.floor(alpha * 120).toString(16).padStart(2, '0'));
        
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1 * na.scale;
        ctx.stroke();

        // Energy chunk
        const t = (angleRef.current * 1.5 + a) % 1;
        const px = na.x + (nb.x - na.x) * t;
        const py = na.y + (nb.y - na.y) * t;
        ctx.beginPath();
        ctx.arc(px, py, 2 * na.scale, 0, Math.PI * 2);
        ctx.fillStyle = na.color;
        ctx.fill();
      });

      // Nodes
      transformed.forEach(n => {
        const pulse = 1 + 0.1 * Math.sin(angle * 3 + n.x);
        const radius = n.r * n.scale * pulse;

        // Glow
        const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 3);
        gr.addColorStop(0, n.color + '44');
        gr.addColorStop(1, n.color + '00');
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        if (n.scale > 0.6) {
           ctx.fillStyle = 'rgba(255,255,255,' + (n.scale - 0.4) + ')';
           ctx.font = Math.floor(9 * n.scale) + 'px JetBrains Mono';
           ctx.textAlign = 'center';
           ctx.fillText(n.label, n.x, n.y + radius + 15);
        }
      });

      rafRef.current = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="canvas-card" style={{ height: 360 }}>
      <div className="card-hdr">
        <div className="card-title">🌐 Tactical Network Topology <span className="live-badge">3D_ACTIVE</span></div>
        <div className="flex gap-2">
          <div className="ms-dot ms-dot-g animate-pulse" />
          <span className="text-[10px] opacity-50 font-mono">Z_BUFFER_ENABLED</span>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'calc(100% - 50px)' }} />
    </div>
  );
}

// ── Main Dashboard ──
export default function ProDashboard() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [clock, setClock] = useState('--:--:--');

  const throughputRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);

  const fetchData = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [agentData, taskData, traceData, summaryData] = await Promise.allSettled([
        apiFetch<AgentSummary[]>('/agents/'),
        apiFetch<TaskSummary[]>('/tasks/'),
        apiFetch<TraceEntry[]>('/traces/?limit=20'),
        apiFetch<any>('/analytics/summary'),
      ]);

      if (agentData.status === 'fulfilled') setAgents(agentData.value || []);
      if (taskData.status === 'fulfilled') setTasks(taskData.value || []);
      if (traceData.status === 'fulfilled') setTraces(traceData.value || []);
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value || {});
    } catch (e) {
      console.error('Dashboard fetch error', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    const clockInterval = setInterval(() => {
      setClock(new Date().toTimeString().split(' ')[0]);
    }, 1000);
    return () => { clearInterval(interval); clearInterval(clockInterval); };
  }, [fetchData]);

  // Compute task distribution
  const taskStats = {
    completed: tasks.filter(t => t.status === 'completed').length,
    running: tasks.filter(t => t.status === 'running' || t.status === 'processing').length,
    queued: tasks.filter(t => t.status === 'queued').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  // Draw donut when tasks change
  useEffect(() => {
    if (donutRef.current) {
      drawDonut(donutRef.current, [
        { value: taskStats.completed, color: '#00f5d4' },
        { value: taskStats.running, color: '#00b4f0' },
        { value: taskStats.queued, color: '#8b5cf6' },
        { value: taskStats.failed, color: '#ef4444' },
      ]);
    }
  }, [taskStats.completed, taskStats.running, taskStats.queued, taskStats.failed]);

  // Draw throughput when component mounts
  useEffect(() => {
    if (throughputRef.current) {
      const w = throughputRef.current.offsetWidth || 500;
      throughputRef.current.width = w;
      const pts1 = Array.from({ length: 30 }, (_, i) => 35 + 30 * Math.abs(Math.sin(i * 0.4)) + Math.random() * 12);
      const pts2 = Array.from({ length: 30 }, (_, i) => 20 + 22 * Math.abs(Math.cos(i * 0.36)) + Math.random() * 10);
      drawSparkline(throughputRef.current, pts1, '#00b4f0');
      // Draw second line on same canvas
      const ctx = throughputRef.current.getContext('2d');
      if (ctx) {
        const h = 80;
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#8b5cf655');
        grad.addColorStop(1, '#8b5cf600');
        ctx.beginPath();
        ctx.moveTo(0, h - (pts2[0] / 100) * h);
        pts2.forEach((p, i) => ctx.lineTo((i / (pts2.length - 1)) * w, h - (p / 100) * h));
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, h - (pts2[0] / 100) * h);
        pts2.forEach((p, i) => ctx.lineTo((i / (pts2.length - 1)) * w, h - (p / 100) * h));
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, []);

  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'online').length;

  return (
    <div style={{ animation: 'pageIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Command Center</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>
            ● All systems operational · <span>{clock}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={fetchData}>↺ Refresh</button>
          <button className="btn btn-primary" onClick={() => (window as any).openAddAgent?.()}>+ Add Agent</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-lbl">Active Agents</div>
          <div className="stat-val blue">{activeAgents || agents.length}</div>
          <div className="stat-sub">of {agents.length} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Tasks Total</div>
          <div className="stat-val">{tasks.length}</div>
          <div className="stat-sub">{taskStats.running} running now</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Success Rate</div>
          <div className="stat-val green">
            {tasks.length > 0
              ? ((taskStats.completed / tasks.length) * 100).toFixed(0)
              : '100'}%
          </div>
          <div className="stat-sub">{taskStats.failed} failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Events</div>
          <div className="stat-val">{summary.active_events ?? traces.length}</div>
          <div className="stat-sub">tracked events</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Credits Used</div>
          <div className="stat-val">${(summary.total_cost ?? 0).toFixed(2)}</div>
          <div className="stat-sub">API spend</div>
        </div>
      </div>

      {/* Dashboard Grid: Topology + Health */}
      <div className="dash-grid">
        <TopoCanvas />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Health Card */}
          <div className="health-card">
            <div className="card-title" style={{ marginBottom: 12 }}>🛡 System Health</div>
            <div className="health-row">
              <div className="health-row-hdr">
                <span>🔧 Agents Online</span>
                <span className="health-pct">{agents.length > 0 ? ((activeAgents / agents.length) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="health-bar">
                <div className="health-fill" style={{
                  width: `${agents.length > 0 ? (activeAgents / agents.length) * 100 : 0}%`,
                  background: 'var(--blue)'
                }} />
              </div>
            </div>
            <div className="health-row">
              <div className="health-row-hdr">
                <span>✓ Task Success</span>
                <span className="health-pct">
                  {tasks.length > 0 ? ((taskStats.completed / tasks.length) * 100).toFixed(0) : 100}%
                </span>
              </div>
              <div className="health-bar">
                <div className="health-fill" style={{
                  width: `${tasks.length > 0 ? (taskStats.completed / tasks.length) * 100 : 100}%`,
                  background: 'var(--cyan)'
                }} />
              </div>
            </div>
            <div className="health-row">
              <div className="health-row-hdr">
                <span>📶 Queue</span>
                <span className="health-pct">{taskStats.queued} pending</span>
              </div>
              <div className="health-bar">
                <div className="health-fill" style={{
                  width: `${tasks.length > 0 ? Math.min((taskStats.queued / Math.max(tasks.length, 1)) * 100, 100) : 0}%`,
                  background: 'var(--purple)'
                }} />
              </div>
            </div>
          </div>

          {/* Task Distribution Donut */}
          <div className="chart-card">
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>📊 Task Distribution</div>
            <canvas ref={donutRef} width={180} height={140} style={{ display: 'block', margin: '0 auto' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00f5d4', display: 'inline-block' }} />
                Completed <b>{taskStats.completed}</b>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00b4f0', display: 'inline-block' }} />
                Running <b>{taskStats.running}</b>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
                Queued <b>{taskStats.queued}</b>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                Failed <b>{taskStats.failed}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Throughput Chart */}
      <div className="chart-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>📉 Throughput</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t2)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00b4f0' }} /> Inbound
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t2)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6' }} /> Outbound
            </div>
          </div>
        </div>
        <canvas ref={throughputRef} height={80} style={{ width: '100%' }} />
      </div>

      {/* Activity Feed */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>⚡ Recent Activity</div>
          <div style={{
            fontSize: 11, color: 'var(--t3)', background: 'var(--bg1)',
            padding: '2px 8px', borderRadius: 5, border: '1px solid var(--border)'
          }}>
            Live · {traces.length} events
          </div>
        </div>
        {traces.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: 20 }}>
            No recent activity. Submit a task to see events here.
          </div>
        ) : (
          traces.slice(0, 10).map((trace, i) => {
            const typeMap: Record<string, string> = {
              task_completed: 'DATA',
              task_failed: 'ERROR',
              task_started: 'NODE',
              agent_registered: 'SYNC',
            };
            const styleMap: Record<string, string> = {
              DATA: 't-data',
              ERROR: 't-err',
              NODE: 't-node',
              SYNC: 't-sync',
              WARN: 't-warn',
            };
            const type = typeMap[trace.event_type] || 'NODE';
            const time = trace.created_at
              ? new Date(trace.created_at).toLocaleTimeString()
              : '--:--';

            return (
              <div key={trace.trace_id || i} className="act-item">
                <span className="act-time">[{time}]</span>
                <span className={`act-type ${styleMap[type] || 't-node'}`}>{type}</span>
                <span className="act-text">
                  {trace.event_type}{trace.agent_id ? ` · ${trace.agent_id.slice(0, 8)}` : ''}
                </span>
                <span className={trace.event_type.includes('fail') ? 'act-fail' : 'act-ok'}>
                  {trace.event_type.includes('fail') ? 'Failed' : 'OK'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
