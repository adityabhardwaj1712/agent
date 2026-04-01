'use client';

import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';

/* ═══════════════════════════════════════════════════
   DASHBOARD VIEW — Network + KPIs + Activity Log
═══════════════════════════════════════════════════ */

interface DashboardStats {
  active_agents: number;
  total_tasks: number;
  success_rate: number;
  total_cost: number;
  active_events: number;
}

// ── SPARKLINE MINI-CANVAS ──
function drawSparkline(canvas: HTMLCanvasElement, data: number[], color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = 70;
  canvas.height = 30;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 70,
    y: 28 - ((v - min) / range) * 24,
  }));
  const grad = ctx.createLinearGradient(0, 0, 0, 30);
  grad.addColorStop(0, color + '55');
  grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(70, 30);
  ctx.lineTo(0, 30);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// ── NETWORK TOPOLOGY CANVAS ──
function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const theme = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-theme') || 'dark'
    : 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 600;
    canvas.height = canvas.offsetHeight || 380;
    const W = canvas.width, H = canvas.height;

    const nodes = [
      { id: 'core-a-ing', label: 'Core-A\n(Ingress)', x: 0.5, y: 0.12, z: 0, color: '#00b4f0', size: 12, type: 'core' },
      { id: 'core-a', label: 'Core-A', x: 0.72, y: 0.22, z: 0.2, color: '#00b4f0', size: 10, type: 'core' },
      { id: 'waller-a', label: 'Waller-A', x: 0.88, y: 0.32, z: 0.1, color: '#8b5cf6', size: 9, type: 'worker' },
      { id: 'data-lake', label: 'Data-Lake\n(Storage)', x: 0.22, y: 0.35, z: 0.15, color: '#f59e0b', size: 11, type: 'storage' },
      { id: 'worker-2', label: 'Worker-2', x: 0.65, y: 0.45, z: 0.25, color: '#10b981', size: 8, type: 'worker' },
      { id: 'worker-3a', label: 'Worker-3', x: 0.48, y: 0.38, z: 0.18, color: '#10b981', size: 8, type: 'worker' },
      { id: 'wc1', label: 'Worker Cluster-1\n(Processing)', x: 0.25, y: 0.6, z: 0.3, color: '#ec4899', size: 10, type: 'cluster' },
      { id: 'worker-3b', label: 'Worker-3', x: 0.15, y: 0.75, z: 0.1, color: '#10b981', size: 7, type: 'worker' },
      { id: 'worker-1', label: 'Worker-1', x: 0.3, y: 0.88, z: 0.05, color: '#10b981', size: 8, type: 'worker' },
      { id: 'core-a2', label: 'Core-A', x: 0.5, y: 0.78, z: 0.2, color: '#00b4f0', size: 9, type: 'core' },
    ];

    const edges: [string, string][] = [
      ['core-a-ing', 'core-a'], ['core-a-ing', 'data-lake'], ['core-a', 'waller-a'],
      ['core-a', 'worker-2'], ['core-a', 'worker-3a'], ['data-lake', 'wc1'],
      ['data-lake', 'worker-3a'], ['wc1', 'worker-3b'], ['wc1', 'worker-1'],
      ['core-a2', 'worker-1'], ['core-a2', 'core-a-ing'], ['worker-2', 'waller-a'],
      ['worker-3a', 'worker-2'],
    ];

    const edgeColors = ['rgba(0,180,240,', 'rgba(139,92,246,', 'rgba(16,185,129,', 'rgba(245,158,11,', 'rgba(236,72,153,'];
    let angle = 0;
    let mx = -1, my = -1;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      my = (e.clientY - r.top) / r.height;
    };
    const onLeave = () => {
      mx = -1; my = -1;
      if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    function project(nx: number, ny: number, nz: number) {
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const rx = (nx - 0.5) * cosA - nz * sinA + 0.5;
      const ry = ny;
      const scale = 1 / (1.5 - nz * 0.4);
      return {
        x: (rx - 0.5) * scale * 0.9 + 0.5,
        y: (ry - 0.5) * scale * 0.85 + 0.5,
        scale,
      };
    }

    function draw() {
      angle += 0.003;
      ctx.clearRect(0, 0, W, H);

      // Background grid dots
      ctx.fillStyle = 'rgba(0,180,240,0.05)';
      for (let gx = 0; gx < W; gx += 40) {
        for (let gy = 0; gy < H; gy += 40) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const proj = nodes.map(n => ({ ...n, ...project(n.x, n.y, n.z) }));

      // Edges
      edges.forEach(([a, b], ei) => {
        const pa = proj.find(p => p.id === a);
        const pb = proj.find(p => p.id === b);
        if (!pa || !pb) return;
        const ax = pa.x * W, ay = pa.y * H, bx = pb.x * W, by = pb.y * H;
        const ec = edgeColors[ei % edgeColors.length];
        const alpha = 0.25 + Math.sin(angle * 3 + ei) * 0.1;
        const grd = ctx.createLinearGradient(ax, ay, bx, by);
        grd.addColorStop(0, ec + alpha + ')');
        grd.addColorStop(1, ec + (alpha * 0.3) + ')');
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = grd;
        ctx.lineWidth = 1.5 * (pa.scale + pb.scale) / 2;
        ctx.stroke();

        // Traveling dot
        const t = ((angle * 8 + ei * 1.7) % 1 + 1) % 1;
        const dx = ax + (bx - ax) * t, dy = ay + (by - ay) * t;
        ctx.beginPath();
        ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = ec + '0.9)';
        ctx.fill();
      });

      // Nodes
      let newHov: typeof proj[0] | null = null;
      proj.forEach(n => {
        const nx = n.x * W, ny = n.y * H;
        const r = n.size * n.scale;
        const dist = mx >= 0 ? Math.hypot((mx - n.x), (my - n.y) * W / H) : 999;
        const isHov = dist < r / W * 2;
        if (isHov) newHov = n;

        // Glow
        if (isHov || n.type === 'core') {
          const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 3);
          glow.addColorStop(0, n.color + '40');
          glow.addColorStop(1, n.color + '00');
          ctx.beginPath();
          ctx.arc(nx, ny, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        const ngrad = ctx.createRadialGradient(nx - r * 0.3, ny - r * 0.3, 0, nx, ny, r);
        ngrad.addColorStop(0, n.color + 'ff');
        ngrad.addColorStop(1, n.color + '99');
        ctx.fillStyle = ngrad;
        ctx.fill();

        // Ring
        ctx.beginPath();
        ctx.arc(nx, ny, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = n.color + (isHov ? 'cc' : '44');
        ctx.lineWidth = isHov ? 2 : 1;
        ctx.stroke();

        // Label
        const label = n.label.split('\n');
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        ctx.fillStyle = isDark ? '#e8f4ff' : '#0a1e30';
        ctx.font = `${Math.max(9, 10 * n.scale)}px 'Outfit',sans-serif`;
        ctx.textAlign = 'center';
        label.forEach((ln, li) => {
          ctx.fillText(ln, nx, ny + r + 12 + li * 11);
        });
      });

      // Tooltip
      if (newHov && tooltipRef.current) {
        const tt = tooltipRef.current;
        const nx = newHov.x * canvas.offsetWidth;
        const ny = newHov.y * canvas.offsetHeight;
        tt.style.left = (nx + 20) + 'px';
        tt.style.top = (ny - 10) + 'px';
        tt.style.opacity = '1';
        tt.innerHTML = `<b style="color:${newHov.color}">${newHov.label.replace('\n', ' ')}</b><br>Type: ${newHov.type}<br>Status: Online`;
      } else if (tooltipRef.current) {
        tooltipRef.current.style.opacity = '0';
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div style={{ position: 'relative', height: '380px' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      <div className="node-tooltip" ref={tooltipRef} />
    </div>
  );
}

// ── ACTIVITY LOG ──
function generateActivity(): { time: string; tag: string; tagCls: string; worker: string; tid: string }[] {
  const tags = ['NODE', 'WARN', 'TASK', 'PROC', 'SYNC', 'ERR'];
  const tagCls: Record<string, string> = { NODE: 'tag-node', WARN: 'tag-warn', TASK: 'tag-task', PROC: 'tag-proc', SYNC: 'tag-sync', ERR: 'tag-err' };
  const workers = ['Worker_75', 'Worker_45', 'Worker_77', 'Worker_01', 'Worker_12', 'Worker_56', 'Worker_16', 'Worker_88', 'Worker_38', 'Worker_36', 'Worker_19', 'Worker_58'];

  return Array.from({ length: 16 }, (_, i) => {
    const tag = tags[Math.floor(Math.random() * tags.length)];
    const w = workers[i % workers.length];
    const tid = Math.random().toString(36).slice(2, 6).toUpperCase();
    const h = String(Math.floor(Math.random() * 2) + 22).padStart(2, '0');
    const m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const s = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return { time: `${h}:${m}:${s}`, tag, tagCls: tagCls[tag], worker: w, tid };
  });
}

// ── MAIN DASHBOARD EXPORT ──
export default function DashboardView() {
  const [clock, setClock] = useState('--:--:--');
  const [stats, setStats] = useState<DashboardStats>({
    active_agents: 0, total_tasks: 0, success_rate: 0, total_cost: 0, active_events: 0,
  });
  const [activity] = useState(generateActivity);

  const sparkAgents = useRef<HTMLCanvasElement>(null);
  const sparkTp = useRef<HTMLCanvasElement>(null);
  const sparkSr = useRef<HTMLCanvasElement>(null);
  const sparkLat = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Clock
    const clockInterval = setInterval(() => {
      setClock(new Date().toTimeString().split(' ')[0]);
    }, 1000);
    setClock(new Date().toTimeString().split(' ')[0]);

    // Fetch stats
    const fetchStats = async () => {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        if (data) setStats(prev => ({ ...prev, ...data }));
      } catch {}
    };
    fetchStats();
    const statsInterval = setInterval(fetchStats, 20000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(statsInterval);
    };
  }, []);

  // Sparklines
  useEffect(() => {
    if (sparkAgents.current) drawSparkline(sparkAgents.current, [98, 105, 110, 108, 115, 120, 118, 124], '#00b4f0');
    if (sparkTp.current) drawSparkline(sparkTp.current, [0.8, 0.9, 1.1, 1.0, 1.3, 1.2, 1.1, 1.2], '#8b5cf6');
    if (sparkSr.current) drawSparkline(sparkSr.current, [99.2, 99.4, 99.6, 99.5, 99.7, 99.8, 99.7, 99.8], '#10b981');
    if (sparkLat.current) drawSparkline(sparkLat.current, [18, 15, 14, 13, 12, 13, 11, 12], '#f59e0b');
  }, []);

  const onlineCount = stats.active_agents || 0;

  return (
    <div className="view-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="pg-breadcrumb">Dashboard {'>'} <span>Command Center</span></div>
          <h1 className="pg-title">Network Core</h1>
          <div className="pg-sub">
            Connected nodes and datapoints — All systems operational ·{' '}
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{clock}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm">🕐 Last 24h</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-icon" style={{ background: 'rgba(0,180,240,0.1)', color: 'var(--blue)' }}>⚡</div>
          <div className="kpi-val">{onlineCount}</div>
          <div className="kpi-label">Active Agents</div>
          <div className="kpi-delta up">↑ +2 from last hour</div>
          <canvas className="kpi-spark" ref={sparkAgents} />
        </div>
        <div className="kpi">
          <div className="kpi-icon" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)' }}>🔄</div>
          <div className="kpi-val">1.2<span> GB/s</span></div>
          <div className="kpi-label">Throughput · Live</div>
          <div className="kpi-delta up">↑ File Data · Sys Logs · API</div>
          <canvas className="kpi-spark" ref={sparkTp} />
        </div>
        <div className="kpi">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)' }}>✓</div>
          <div className="kpi-val">
            {stats.success_rate ? (stats.success_rate * 100).toFixed(1) : '99.8'}<span>%</span>
          </div>
          <div className="kpi-label">Success Rate</div>
          <div className="kpi-delta up">↑ +0.2% from last hour</div>
          <canvas className="kpi-spark" ref={sparkSr} />
        </div>
        <div className="kpi">
          <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--orange)' }}>⚡</div>
          <div className="kpi-val">12<span> ms</span></div>
          <div className="kpi-label">Avg Latency</div>
          <div className="kpi-delta up">Within SLA threshold</div>
          <canvas className="kpi-spark" ref={sparkLat} />
        </div>
      </div>

      {/* Main Grid: Network + Activity */}
      <div className="grid-main">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div className="card-title" style={{ margin: 0 }}>Network Topology</div>
            <span className="pill pill-green" style={{ fontSize: 9 }}>● LIVE</span>
          </div>
          <NetworkCanvas />
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div className="card-title" style={{ margin: 0 }}>Recent Activity</div>
            <span className="pill pill-blue">{activity.length} events</span>
          </div>
          <div style={{ padding: '0 20px', overflowY: 'auto', maxHeight: 380 }}>
            {activity.map((a, i) => (
              <div key={i} className="log-entry">
                <span className="log-time">[{a.time}]</span>
                <span className={`log-tag ${a.tagCls}`}>{a.tag}</span>
                {a.worker} | Task {a.tid}
                <div style={{ color: 'var(--t3)', fontSize: 10 }}>Status: Completed</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
