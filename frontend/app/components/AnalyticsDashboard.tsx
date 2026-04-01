'use client';

import React, { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════
   ANALYTICS VIEW — Charts, Heatmap, KPIs
═══════════════════════════════════════════════════ */

function drawLineChart(canvas: HTMLCanvasElement, data: number[], color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = canvas.offsetWidth || 500;
  canvas.height = canvas.offsetHeight || 220;
  const W = canvas.width, H = canvas.height;
  const pad = { t: 20, b: 30, l: 40, r: 10 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const max = Math.max(...data) || 1;

  // Grid
  ctx.strokeStyle = 'rgba(0,180,240,0.06)';
  ctx.fillStyle = '#3a6080';
  ctx.font = '10px "Outfit",sans-serif';
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(max - (max / 4) * i)), pad.l - 6, y + 4);
  }

  // X labels
  ctx.textAlign = 'center';
  for (let i = 0; i < data.length; i += 4) {
    const x = pad.l + (i / (data.length - 1)) * plotW;
    ctx.fillText(i + ':00', x, H - 8);
  }

  // Data
  const pts = data.map((v, i) => ({
    x: pad.l + (i / (data.length - 1)) * plotW,
    y: pad.t + plotH - (v / max) * plotH,
  }));

  // Area
  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, color + '22');
  grad.addColorStop(1, color + '00');
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
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots at peaks
  pts.forEach((p, i) => {
    if (data[i] === max || (i > 0 && i < data.length - 1 && data[i] > data[i - 1] && data[i] > data[i + 1])) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  });
}

function drawDoughnut(canvas: HTMLCanvasElement, segments: { value: number; color: string }[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = canvas.offsetHeight || 180;
  canvas.height = canvas.offsetHeight || 180;
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const radius = Math.min(cx, cy) - 10;
  const innerRadius = radius * 0.6;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let startAngle = -Math.PI / 2;
  segments.forEach(seg => {
    const sliceAngle = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += sliceAngle;
  });
}

export default function AnalyticsView() {
  const throughputRef = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (throughputRef.current) {
        drawLineChart(
          throughputRef.current,
          Array.from({ length: 24 }, () => Math.floor(Math.random() * 3000) + 500),
          '#00b4f0'
        );
      }
      if (distRef.current) {
        drawDoughnut(distRef.current, [
          { value: 847, color: 'rgba(16,185,129,0.7)' },
          { value: 124, color: 'rgba(0,180,240,0.7)' },
          { value: 56, color: 'rgba(245,158,11,0.7)' },
          { value: 12, color: 'rgba(239,68,68,0.7)' },
        ]);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Heatmap data
  const heatmapCells = Array.from({ length: 16 * 8 }, () => {
    const v = Math.random();
    const c = v > 0.8 ? 'var(--red)' : v > 0.6 ? 'var(--orange)' : v > 0.4 ? 'var(--blue)' : 'rgba(0,180,240,0.15)';
    return { color: c, opacity: 0.4 + v * 0.6, value: Math.round(v * 100) };
  });

  return (
    <div className="view-enter">
      <div style={{ marginBottom: 24 }}>
        <h1 className="pg-title">Analytics</h1>
        <div className="pg-sub">Performance insights and operational metrics</div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-icon" style={{ background: 'rgba(0,180,240,0.1)', color: 'var(--blue)' }}>📊</div>
          <div className="kpi-val">2,847</div>
          <div className="kpi-label">Tasks / min</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)' }}>✓</div>
          <div className="kpi-val">99.97<span>%</span></div>
          <div className="kpi-label">Uptime</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--orange)' }}>⚡</div>
          <div className="kpi-val">12<span> ms</span></div>
          <div className="kpi-label">P99 Latency</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)' }}>💰</div>
          <div className="kpi-val">$0.042</div>
          <div className="kpi-label">Cost / Task</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-hd"><div className="card-title">Task Throughput (24h)</div></div>
          <div className="chart-wrap">
            <canvas ref={throughputRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Task Distribution</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <span style={{ color: 'var(--green)' }}>● Completed 847</span>
              <span style={{ color: 'var(--blue)' }}>● Running 124</span>
              <span style={{ color: 'var(--orange)' }}>● Queued 56</span>
              <span style={{ color: 'var(--red)' }}>● Failed 12</span>
            </div>
          </div>
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={distRef} style={{ width: 180, height: 180 }} />
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card">
        <div className="card-hd"><div className="card-title">Agent Performance Heatmap</div></div>
        <div className="heatmap-grid">
          {heatmapCells.map((cell, i) => (
            <div key={i} className="heatmap-cell"
              style={{ background: cell.color, opacity: cell.opacity }}
              title={`${cell.value}%`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--t3)', marginTop: 8 }}>
          <span>◆ Low (0-40%)</span>
          <span style={{ color: 'var(--blue)' }}>◆ Medium (40-60%)</span>
          <span style={{ color: 'var(--orange)' }}>◆ High (60-80%)</span>
          <span style={{ color: 'var(--red)' }}>◆ Critical (80%+)</span>
        </div>
      </div>
    </div>
  );
}
