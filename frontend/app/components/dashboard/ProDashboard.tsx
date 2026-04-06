'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, getToken } from '../../lib/api';

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

// ── Topology Canvas (Tactical 3D) ──
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

    const nodes3d = [
      { label: 'STRATEGIC_GW', pos: [-0.9, 0.1, -0.2], color: '#00f2ff', r: 11 },
      { label: 'NEURAL_CORE_A', pos: [-0.3, -0.4, 0.5], color: '#0088ff', r: 9 },
      { label: 'NEURAL_CORE_B', pos: [-0.3, 0.4, -0.4], color: '#0088ff', r: 9 },
      { label: 'REDIS_CACHE', pos: [0.2, -0.5, 0.6], color: '#ff0055', r: 8 },
      { label: 'DB_CLUSTER', pos: [0.2, 0.5, -0.6], color: '#ff9d00', r: 12 },
      { label: 'WORKER_OMEGA', pos: [0.7, -0.2, 0.3], color: '#00ffaa', r: 7 },
      { label: 'WORKER_SIGMA', pos: [0.7, 0.3, 0.1], color: '#00ffaa', r: 7 },
      { label: 'VECTOR_MEM', pos: [0.4, 0, 0], color: '#7000ff', r: 10 },
      { label: 'SIGNAL_BUS', pos: [-0.1, 0, 0.2], color: '#7000ff', r: 8 },
    ];

    const edges = [[0,1],[0,2],[1,3],[2,4],[1,8],[2,8],[8,5],[8,6],[4,7],[7,5],[7,6]];

    const FOV = 500;

    function project(x: number, y: number, z: number, w: number, h: number) {
      const scale = FOV / (FOV + z);
      return { x: x * scale + w / 2, y: y * scale + h / 2, scale };
    }

    function frame() {
      if (!canvas) return;
      const w = canvas.width, h = canvas.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (spinRef.current) angleRef.current += 0.003;
      const angle = angleRef.current;
      ctx.clearRect(0, 0, w, h);

      // Grid Base
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)';
      for (let i = -6; i <= 6; i++) {
         const p1 = project(i * 80, 150, -400, w, h);
         const p2 = project(i * 80, 150, 400, w, h);
         ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
         const p3 = project(-400, 150, i * 80, w, h);
         const p4 = project(400, 150, i * 80, w, h);
         ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
      }

      const cos = Math.cos(angle), sin = Math.sin(angle);
      const transformed = nodes3d.map(n => {
        const [nx, ny, nz] = n.pos;
        const rx = nx * cos - nz * sin;
        const rz = nx * sin + nz * cos;
        return { ...n, ...project(rx * (w * 0.3), ny * (h * 0.3), rz * 200, w, h), z: rz };
      });

      edges.forEach(([a, b]) => {
        const na = transformed[a], nb = transformed[b];
        ctx.beginPath();
        ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = `rgba(0, 242, 255, ${Math.max(0.05, (na.scale+nb.scale)/2 - 0.5)})`;
        ctx.lineWidth = 1; ctx.stroke();
        
        // Pulse
        const t = (angleRef.current * 2 + a) % 1;
        ctx.beginPath();
        ctx.arc(na.x + (nb.x-na.x)*t, na.y + (nb.y-na.y)*t, 2*na.scale, 0, Math.PI*2);
        ctx.fillStyle = na.color; ctx.fill();
      });

      transformed.sort((a,b) => b.z - a.z).forEach(n => {
        const r = n.r * n.scale * (1 + 0.05 * Math.sin(angle*4));
        ctx.beginPath(); ctx.arc(n.x, n.y, r*3, 0, Math.PI*2);
        ctx.fillStyle = n.color + '22'; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2);
        ctx.fillStyle = n.color; ctx.fill();
        if (n.scale > 0.7) {
          ctx.fillStyle = `rgba(255,255,255,${n.scale-0.3})`;
          ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
          ctx.fillText(n.label, n.x, n.y + r + 14);
        }
      });
      rafRef.current = requestAnimationFrame(frame);
    }
    frame();
    return () => { window.removeEventListener('resize', resize); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="card terminal-flicker" style={{ height: 400, position: 'relative', overflow: 'hidden' }}>
      <div className="card-hd">
        <div className="card-title">🛰️ STRATEGIC TOPO_NET <span className="pill pill-blue">LIVE_SYNC</span></div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100% - 50px)' }} />
    </div>
  );
}

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
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchData();
    const i1 = setInterval(fetchData, 10000);
    const i2 = setInterval(() => setClock(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, [fetchData]);

  const taskStats = {
    completed: tasks.filter(t => t.status === 'completed').length,
    running: tasks.filter(t => ['running','processing'].includes(t.status)).length,
    queued: tasks.filter(t => t.status === 'queued').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  useEffect(() => {
    if (donutRef.current) {
      drawDonut(donutRef.current, [
        { value: taskStats.completed, color: '#00ffaa' },
        { value: taskStats.running, color: '#0088ff' },
        { value: taskStats.queued, color: '#7000ff' },
        { value: taskStats.failed, color: '#ff0055' },
      ]);
    }
  }, [taskStats]);

  useEffect(() => {
    if (throughputRef.current) {
      const w = throughputRef.current.width = throughputRef.current.offsetWidth || 500;
      const pts = Array.from({length:30}, (_,i) => 30 + 40*Math.abs(Math.sin(i*0.4)) + Math.random()*10);
      drawSparkline(throughputRef.current, pts, '#00f2ff');
    }
  }, []);

  return (
    <div className="view-enter" style={{ paddingBottom: 40 }}>
      {/* Tactical Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
        <div>
          <div className="pg-breadcrumb">OPERATIONAL_THEATER // <span>SECTOR_ALPHA</span></div>
          <h1 className="pg-title" style={{ color: 'var(--cyan)', textShadow: 'var(--glow)', fontSize: '28px' }}>
            STRATEGIC COMMAND
          </h1>
          <div className="sys-status">
            <div className="sys-dot" style={{ background:'var(--cyan)', boxShadow:'0 0 10px var(--cyan)' }} />
            <span style={{ fontFamily:'var(--mono)', fontSize:'10px', color:'var(--t2)' }}>
              NODE_STABLE // SYSTEM_NOMINAL // {clock} // GMT+0
            </span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
           <button className="btn btn-ghost btn-sm" onClick={fetchData}>[ RE_SCAN ]</button>
           <button className="btn btn-primary btn-sm" style={{ background:'var(--cyan)', color:'#000' }}>[ NEW_MISSION ]</button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">TOTAL_FLEET_STRENGTH</div>
          <div className="kpi-val" style={{ color: 'var(--cyan)' }}>{agents.length} <span style={{ color:'var(--t3)' }}>AGNTS</span></div>
          <div className="kpi-delta up">▲ NOMINAL</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">ACTIVE_MISSIONS</div>
          <div className="kpi-val">{tasks.length}</div>
          <div className="kpi-delta" style={{ color:'var(--blue)' }}>⚡ {taskStats.running} RUNNING</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">SUCCESS_RATIO</div>
          <div className="kpi-val" style={{ color: 'var(--green)' }}>
            {tasks.length > 0 ? ((taskStats.completed/tasks.length)*100).toFixed(1) : 100}%
          </div>
          <div className="kpi-delta dn" style={{ color: 'var(--red)' }}>▼ {taskStats.failed} CRITICAL</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">INTEL_SURGE_COST</div>
          <div className="kpi-val">${(summary.total_cost || 0).toFixed(2)}</div>
          <div className="kpi-delta" style={{ color:'var(--t3)' }}>CREDITS_BURN_RATE: LOW</div>
        </div>
      </div>

      <div className="grid-main">
        <TopoCanvas />
        
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
           <div className="card">
              <div className="card-hd"><div className="card-title">🛡️ SYSTEM_TELEMETRY</div></div>
              {[
                { l: 'CPU_LOAD', v: '12%', c: 'var(--cyan)' },
                { l: 'MEM_BUFFER', v: '44%', c: 'var(--blue)' },
                { l: 'LATENCY', v: '24ms', c: 'var(--purple)' }
              ].map(r => (
                <div key={r.l} style={{ marginBottom: 12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--t2)', marginBottom:4, fontFamily:'var(--mono)' }}>
                    <span>{r.l}</span><span>{r.v}</span>
                  </div>
                  <div className="progress-bar" style={{ width:'100%', height:4, background:'var(--bg3)' }}>
                    <div className="progress-fill" style={{ width: r.v, background: r.c }} />
                  </div>
                </div>
              ))}
           </div>

           <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title" style={{ fontSize:11, marginBottom:15 }}>MISSION_DISTRIBUTION</div>
              <canvas ref={donutRef} width={180} height={140} style={{ margin: '0 auto' }} />
           </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
         <div className="card-hd">
            <div className="card-title">⚡ NEURAL_ACTIVITY_LOG</div>
         </div>
         <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {traces.length === 0 ? (
               <div style={{ padding: 20, textAlign: 'center', color: 'var(--t3)', fontSize: 11 }}>NO_ACTIVE_SIGNALS_DETECTED</div>
            ) : traces.map((t, i) => (
               <div key={i} className="log-entry" style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
                  <span className="log-time">[{new Date(t.created_at).toLocaleTimeString()}]</span>
                  <span className={`log-tag ${t.event_type.includes('fail') ? 'tag-err' : 'tag-task'}`}>
                    {t.event_type.toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--text)' }}>
                    {t.payload?.task_id || t.agent_id || 'SYSTEM'} // {t.payload?.status || 'SIGNAL_ACK'}
                  </span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
