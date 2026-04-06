'use client';

import React from 'react';

/* ═══════════════════════════════════════════════════
   TRACES VIEW — Distributed Trace Timeline
═══════════════════════════════════════════════════ */

const TRACE_COLORS = ['#00b4f0', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#00f5d4'];

interface Trace {
  agent: string;
  task: string;
  start: number;
  dur: number;
  color: string;
  spans: { start: number; dur: number; color: string }[];
}

function generateTraces(): Trace[] {
  const agents = ['Worker-12', 'Worker-05', 'Core-A', 'Worker-31', 'Worker-08', 'Data-Lake'];
  const tasks = ['Data Ingestion', 'Model Training', 'Health Check', 'Cache Flush', 'Index Rebuild', 'Backup Snapshot'];
  return agents.map((a, i) => ({
    agent: a,
    task: tasks[i],
    start: Math.random() * 40,
    dur: Math.random() * 50 + 10,
    color: TRACE_COLORS[i % TRACE_COLORS.length],
    spans: Array.from({ length: 3 }, () => ({
      start: Math.random() * 30,
      dur: Math.random() * 15 + 3,
      color: TRACE_COLORS[(i + 1) % TRACE_COLORS.length],
    })),
  }));
}

export default function TracesViewClean() {
  const traces = generateTraces();
  const sorted = [...traces].sort((a, b) => b.dur - a.dur);

  const errors = [
    { code: 'TIMEOUT', count: 3, agent: 'Worker-22' },
    { code: 'OOM', count: 1, agent: 'Core-B' },
    { code: 'CONNECTION', count: 2, agent: 'Worker-44' },
  ];

  return (
    <div className="view-enter">
      <div style={{ marginBottom: 24 }}>
        <h1 className="pg-title">Distributed Traces</h1>
        <div className="pg-sub">Request flow and span analysis across agents</div>
      </div>

      {/* Trace Timeline */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title">Active Trace Timeline</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="Filter by agent..."
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6,
                padding: '5px 10px', fontFamily: 'var(--sans)', fontSize: 11,
                color: 'var(--text)', outline: 'none', width: 160,
              }}
            />
            <button className="btn btn-ghost btn-sm">Export</button>
          </div>
        </div>

        <div style={{ position: 'relative', padding: '8px 0' }}>
          {/* Time scale */}
          <div style={{
            display: 'flex', fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)',
            paddingLeft: 130, marginBottom: 8,
          }}>
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'left' }}>{i * 10}ms</div>
            ))}
          </div>

          {/* Trace rows */}
          {traces.map((t, i) => (
            <div key={i} className="trace-row" style={{ marginBottom: 8 }}>
              <div className="trace-agent">{t.agent}</div>
              <div className="trace-bar-wrap" style={{ position: 'relative', height: 22, marginLeft: 8 }}>
                <div className="trace-bar" style={{
                  left: `${t.start}%`, width: `${t.dur}%`,
                  background: `${t.color}40`, border: `1px solid ${t.color}80`,
                  height: 18, top: 2, borderRadius: 4,
                  display: 'flex', alignItems: 'center', padding: '0 8px',
                }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: t.color, whiteSpace: 'nowrap' }}>
                    {t.task}
                  </span>
                </div>
                {t.spans.map((s, si) => (
                  <div key={si} style={{
                    position: 'absolute',
                    left: `calc(${t.start + s.start * t.dur / 100}%)`,
                    width: `calc(${s.dur}%)`,
                    height: 10, top: 6,
                    background: `${s.color}60`, borderRadius: 2,
                  }} />
                ))}
              </div>
              <div className="trace-dur" style={{ paddingLeft: 8, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>
                {Math.round(t.dur + t.start)}ms
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid-2" style={{ marginTop: 16 }}>
        {/* Top Slow Spans */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Top Slow Spans</div>
          {sorted.slice(0, 5).map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{t.task}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{t.agent}</div>
              </div>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 12,
                color: t.dur > 40 ? 'var(--red)' : t.dur > 25 ? 'var(--orange)' : 'var(--green)',
              }}>
                {Math.round(t.dur)}ms
              </span>
            </div>
          ))}
        </div>

        {/* Error Summary */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Error Summary</div>
          {errors.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <span className="pill pill-red" style={{ marginRight: 8 }}>{e.code}</span>
                <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{e.agent}</span>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)' }}>{e.count}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
