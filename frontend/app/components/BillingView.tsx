'use client';
import React from 'react';

const AGENTS_COST = [
  { name: 'TaskOrchestrator', total: 400, model: 'gpt-4o', emo: '🎯', col: '#22d3ee', cost: '3.20' },
  { name: 'WebResearcher', total: 340, model: 'gpt-4o', emo: '🔍', col: '#5b8cff', cost: '2.72' },
  { name: 'CodeHelper', total: 215, model: 'gpt-4o', emo: '💻', col: '#8b5cf6', cost: '1.72' },
  { name: 'DataAnalyst', total: 178, model: 'claude-sonnet-4-6', emo: '📊', col: '#22d3a0', cost: '1.42' },
  { name: 'ContentWriter', total: 122, model: 'gpt-4o-mini', emo: '✍', col: '#f59e0b', cost: '0.98' },
  { name: 'SecurityGuardian', total: 88, model: 'gpt-4o', emo: '🛡', col: '#f94f6a', cost: '0.70' },
  { name: 'FleetSummarizer', total: 60, model: 'gpt-4o-mini', emo: '📑', col: '#06b6d4', cost: '0.48' },
];

export default function BillingView() {
  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi" style={{ '--kc': 'var(--g)' } as any}><div className="kpi-lbl">Balance</div><div className="kpi-val" style={{ color: 'var(--g)' }}>$485.18</div></div>
        <div className="kpi" style={{ '--kc': 'var(--y)' } as any}><div className="kpi-lbl">This Month</div><div className="kpi-val" style={{ color: 'var(--y)' }}>$42.55</div></div>
        <div className="kpi" style={{ '--kc': 'var(--a)' } as any}><div className="kpi-lbl">Budget</div><div className="kpi-val" style={{ color: 'var(--a)' }}>$200</div></div>
        <div className="kpi" style={{ '--kc': 'var(--r)' } as any}><div className="kpi-lbl">Usage</div><div className="kpi-val" style={{ color: 'var(--r)' }}>21%</div></div>
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-hd-title">Usage by Agent</div></div>
        <div className="card-body">
          {AGENTS_COST.map((a, i) => (
            <div key={i} className="billing-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: `${a.col}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{a.emo}</div>
                <div><div style={{ fontSize: 12.5, fontWeight: 500 }}>{a.name}</div><div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{a.total} tasks · {a.model}</div></div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--y)' }}>${a.cost}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
