'use client';
import React from 'react';

const AGENTS_DATA = [
  { name: 'WebResearcher', total: 340, ok: 328, col: '#5b8cff' },
  { name: 'CodeHelper', total: 215, ok: 200, col: '#8b5cf6' },
  { name: 'DataAnalyst', total: 178, ok: 174, col: '#22d3a0' },
  { name: 'ContentWriter', total: 122, ok: 110, col: '#f59e0b' },
  { name: 'TaskOrchestrator', total: 400, ok: 380, col: '#22d3ee' },
  { name: 'SecurityGuardian', total: 88, ok: 88, col: '#f94f6a' },
  { name: 'FleetSummarizer', total: 60, ok: 55, col: '#06b6d4' },
];
const MODELS = [
  { model: 'gpt-4o', tasks: 820, tokIn: '2.4M', tokOut: '1.1M', cost: '$8.42', quality: '0.91' },
  { model: 'gpt-4o-mini', tasks: 620, tokIn: '1.2M', tokOut: '480K', cost: '$0.84', quality: '0.82' },
  { model: 'claude-sonnet-4-6', tasks: 280, tokIn: '880K', tokOut: '320K', cost: '$5.56', quality: '0.94' },
];

export default function AnalyticsView() {
  const kpis = [
    { val: '98.2%', lbl: 'Success Rate', col: 'var(--g)', pct: 98 },
    { val: '1,847', lbl: 'Total Tasks', col: 'var(--a)', pct: 75 },
    { val: '$14.82', lbl: 'Weekly Spend', col: 'var(--y)', pct: 35 },
    { val: '2.1%', lbl: 'Error Rate', col: 'var(--r)', pct: 21 },
  ];

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} className="metric-card" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="mc-val" style={{ color: k.col }}>{k.val}</div>
            <div className="mc-lbl">{k.lbl}</div>
            <div className="mc-bar"><div className="mc-fill" style={{ width: `${k.pct}%`, background: k.col }}></div></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-hd-title">Agent Performance Comparison</div></div>
        <div className="card-body">
          {AGENTS_DATA.map((a, i) => {
            const sr = a.total ? Math.round(a.ok / a.total * 100) : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 130, fontSize: 12, fontWeight: 500 }}>{a.name}</div>
                <div style={{ flex: 1, height: 16, background: 'var(--bg3)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${sr}%`, background: a.col, borderRadius: 100, opacity: 0.8 }}></div>
                </div>
                <div style={{ width: 50, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>{sr}%</div>
                <div style={{ width: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t3)' }}>{a.total} tasks</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card tbl-wrap">
        <div className="card-hd"><div className="card-hd-title">Model Cost Breakdown</div></div>
        <table><thead><tr><th>Model</th><th>Tasks</th><th>Tokens In</th><th>Tokens Out</th><th>Cost</th><th>Avg Quality</th></tr></thead>
          <tbody>{MODELS.map((m, i) => (
            <tr key={i}><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{m.model}</td><td className="mono-sm">{m.tasks}</td><td className="mono-sm">{m.tokIn}</td><td className="mono-sm">{m.tokOut}</td><td className="mono-sm" style={{ color: 'var(--y)' }}>{m.cost}</td><td className="mono-sm" style={{ color: 'var(--g)' }}>{m.quality}</td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
