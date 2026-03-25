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
    { val: '98.2%', lbl: 'Success Rate', col: 'var(--green)', pct: 98 },
    { val: '1,847', lbl: 'Total Tasks', col: 'var(--blue)', pct: 75 },
    { val: '$14.82', lbl: 'Weekly Spend', col: 'var(--amber)', pct: 35 },
    { val: '2.1%', lbl: 'Error Rate', col: 'var(--red)', pct: 21 },
  ];

  return (
    <div className="ms-content">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} className="ms-card" style={{ padding: '20px', borderLeft: `2px solid ${k.col}` }}>
            <div className="ms-ac-sv" style={{ color: k.col, fontSize: 24 }}>{k.val}</div>
            <div className="ms-ac-sl">{k.lbl}</div>
            <div style={{ background: 'var(--bg3)', height: 4, borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ background: k.col, width: `${k.pct}%`, height: '100%', boxShadow: `0 0 8px ${k.col}` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="ms-panel" style={{ padding: 0 }}>
          <div className="ms-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg3)' }}>
            <div className="ms-card-title">Agent Quality Index</div>
            <div className="ms-badge ms-b-g">Live</div>
          </div>
          <div style={{ padding: '20px' }}>
            {AGENTS_DATA.map((a, i) => {
              const sr = a.total ? Math.round(a.ok / a.total * 100) : 0;
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--t1)' }}>{a.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{sr}% Yield</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${sr}%`, background: a.col, borderRadius: 3, opacity: 0.8, boxShadow: `0 0 4px ${a.col}` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ms-panel" style={{ padding: 0 }}>
          <div className="ms-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg3)' }}>
            <div className="ms-card-title">Token Utilization</div>
            <div className="ms-badge ms-b-p">JSON-L</div>
          </div>
          <div style={{ padding: '0px' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ background: 'var(--bg1)', borderBottom: '1px solid var(--bg3)' }}>
                   <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--t3)' }}>MODEL</th>
                   <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--t3)' }}>COST</th>
                   <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--t3)' }}>THROUGHPUT</th>
                 </tr>
               </thead>
               <tbody>
                 {MODELS.map((m, i) => (
                   <tr key={i} style={{ borderBottom: '1px solid var(--bg2)' }}>
                     <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--blue)' }}>{m.model}</td>
                     <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>{m.cost}</td>
                     <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--t2)' }}>{m.tasks} ops</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}
