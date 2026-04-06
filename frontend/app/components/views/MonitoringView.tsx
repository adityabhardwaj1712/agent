'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════
   MONITORING VIEW — System Health Metrics
═══════════════════════════════════════════════════ */

function drawSmallSpark(canvas: HTMLCanvasElement, data: number[], color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = canvas.offsetWidth || 200;
  canvas.height = 40;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * canvas.width,
    y: 36 - ((v - min) / range) * 30,
  }));
  const grad = ctx.createLinearGradient(0, 0, 0, 40);
  grad.addColorStop(0, color + '55');
  grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(canvas.width, 40);
  ctx.lineTo(0, 40);
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

function drawChart(canvas: HTMLCanvasElement, datasets: { data: number[]; color: string }[], type: 'line' | 'bar' = 'line') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = canvas.offsetWidth || 400;
  canvas.height = 180;
  const W = canvas.width, H = canvas.height;
  const pad = { t: 10, b: 20, l: 10, r: 10 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  // Grid lines
  ctx.strokeStyle = 'rgba(0,180,240,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = pad.t + (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
  }

  datasets.forEach(ds => {
    const max = Math.max(...ds.data) || 1;
    const pts = ds.data.map((v, i) => ({
      x: pad.l + (i / (ds.data.length - 1)) * plotW,
      y: pad.t + plotH - (v / max) * plotH,
    }));

    if (type === 'bar') {
      const barW = plotW / ds.data.length * 0.7;
      ds.data.forEach((v, i) => {
        const x = pad.l + (i / ds.data.length) * plotW + barW * 0.15;
        const h = (v / max) * plotH;
        ctx.fillStyle = ds.color;
        ctx.fillRect(x, pad.t + plotH - h, barW, h);
      });
    } else {
      // Area fill
      const grad = ctx.createLinearGradient(0, pad.t, 0, H);
      grad.addColorStop(0, ds.color + '22');
      grad.addColorStop(1, ds.color + '00');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, pad.t + plotH);
      ctx.lineTo(pts[0].x, pad.t + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  });
}

export default function MonitoringView() {
  const [cpuVal, setCpuVal] = useState(67);
  const [memVal, setMemVal] = useState(72);

  const cpuRef = useRef<HTMLCanvasElement>(null);
  const memRef = useRef<HTMLCanvasElement>(null);
  const tempRef = useRef<HTMLCanvasElement>(null);
  const netRef = useRef<HTMLCanvasElement>(null);
  const trafficRef = useRef<HTMLCanvasElement>(null);
  const diskRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const rnd = (n: number) => Array.from({ length: n }, () => Math.random() * 60 + 20);
    if (cpuRef.current) drawSmallSpark(cpuRef.current, rnd(20), '#00b4f0');
    if (memRef.current) drawSmallSpark(memRef.current, rnd(20), '#8b5cf6');
    if (tempRef.current) drawSmallSpark(tempRef.current, rnd(20), '#f59e0b');
    if (netRef.current) drawSmallSpark(netRef.current, rnd(20), '#10b981');

    setTimeout(() => {
      const rnd2 = (n: number) => Array.from({ length: n }, () => Math.random() * 800 + 200);
      if (trafficRef.current) {
        drawChart(trafficRef.current, [
          { data: rnd2(20), color: '#00b4f0' },
          { data: rnd2(20), color: '#8b5cf6' },
        ]);
      }
      if (diskRef.current) {
        drawChart(diskRef.current, [
          { data: rnd2(20).map(v => v / 3), color: '#10b981' },
          { data: rnd2(20).map(v => v / 4), color: '#00b4f0' },
        ], 'bar');
      }
    }, 100);

    // Live updates
    const interval = setInterval(() => {
      setCpuVal(60 + Math.floor(Math.random() * 20));
      setMemVal(65 + Math.floor(Math.random() * 15));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const alerts = [
    { color: 'var(--red)', title: 'Worker-7 CPU exceeded 95% threshold', time: '2m ago' },
    { color: 'var(--orange)', title: 'Memory usage on Core-B approaching limit', time: '8m ago' },
    { color: 'var(--blue)', title: 'Auto-scaling triggered for Worker Pool 3', time: '12m ago' },
    { color: 'var(--orange)', title: 'Latency spike detected on ingress node', time: '18m ago' },
    { color: 'var(--t3)', title: 'Scheduled database maintenance in 2h', time: '35m ago' },
  ];

  return (
    <div className="view-enter">
      <div style={{ marginBottom: 24 }}>
        <h1 className="pg-title">System Monitoring</h1>
        <div className="pg-sub">Real-time infrastructure health metrics</div>
      </div>

      <div className="mon-grid">
        <div className="mon-card">
          <div className="mon-icon" style={{ background: 'rgba(0,180,240,0.1)', color: 'var(--blue)' }}>🔧</div>
          <div className="mon-val">{cpuVal}%</div>
          <div className="mon-lbl">CPU Usage</div>
          <canvas ref={cpuRef} style={{ width: '100%', height: 40, marginTop: 8 }} />
        </div>
        <div className="mon-card">
          <div className="mon-icon" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)' }}>💾</div>
          <div className="mon-val">{memVal}%</div>
          <div className="mon-lbl">Memory</div>
          <canvas ref={memRef} style={{ width: '100%', height: 40, marginTop: 8 }} />
        </div>
        <div className="mon-card">
          <div className="mon-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--orange)' }}>🌡</div>
          <div className="mon-val">42°C</div>
          <div className="mon-lbl">Temperature</div>
          <canvas ref={tempRef} style={{ width: '100%', height: 40, marginTop: 8 }} />
        </div>
        <div className="mon-card">
          <div className="mon-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)' }}>📶</div>
          <div className="mon-val">840 MB/s</div>
          <div className="mon-lbl">Network I/O</div>
          <canvas ref={netRef} style={{ width: '100%', height: 40, marginTop: 8 }} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-hd"><div className="card-title">Network Traffic (In/Out)</div></div>
          <div style={{ height: 180 }}><canvas ref={trafficRef} style={{ width: '100%', height: '100%' }} /></div>
        </div>
        <div className="card">
          <div className="card-hd"><div className="card-title">Disk I/O Operations</div></div>
          <div style={{ height: 180 }}><canvas ref={diskRef} style={{ width: '100%', height: '100%' }} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div style={{ fontSize: 14, fontWeight: 700 }}>⚠ Active Alerts</div>
          <span className="pill pill-orange">5 alerts</span>
        </div>
        {alerts.map((a, i) => (
          <div key={i} className="alert-item">
            <div className="alert-dot" style={{ background: a.color }} />
            <div>
              <div className="alert-title">{a.title}</div>
              <div className="alert-time">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
