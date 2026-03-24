'use client';
import React from 'react';

const AUDIT_ENTRIES = [
  { action: 'agents.register', agent: 'DataAnalyst', user: 'admin', ip: '127.0.0.1', t: '2m ago', code: 200 },
  { action: 'tasks.submit', agent: 'CodeHelper', user: 'admin', ip: '127.0.0.1', t: '5m ago', code: 200 },
  { action: 'memory.write', agent: 'DataAnalyst', user: 'system', ip: '127.0.0.1', t: '8m ago', code: 200 },
  { action: 'approval.reject', agent: 'SecurityGuardian', user: 'admin', ip: '10.0.1.5', t: '12m ago', code: 200 },
  { action: 'agents.delete', agent: 'unknown', user: 'admin', ip: '10.0.1.5', t: '18m ago', code: 200 },
  { action: 'auth.login', agent: '', user: 'admin', ip: '192.168.1.10', t: '25m ago', code: 200 },
  { action: 'billing.threshold', agent: '', user: 'system', ip: '127.0.0.1', t: '30m ago', code: 200 },
  { action: 'tasks.failed', agent: 'SecurityGuardian', user: 'system', ip: '127.0.0.1', t: '35m ago', code: 500 },
];

export default function AuditView() {
  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="card">
        <div className="card-hd"><div className="card-hd-title">Audit Log</div><div className="pill" style={{ marginLeft: 'auto' }}><span className="dot dot-g"></span>Live</div></div>
        <div className="card-body" style={{ maxHeight: 600, overflowY: 'auto' }}>
          {AUDIT_ENTRIES.map((e, i) => (
            <div key={i} className="audit-row">
              <div className="audit-badge" style={{ color: e.code === 200 ? 'var(--g)' : 'var(--r)' }}>{e.code}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontFamily: 'var(--mono)', color: e.code === 200 ? 'var(--text)' : 'var(--r)' }}>{e.action}</div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>user:{e.user} · ip:{e.ip}{e.agent ? ` · agent:${e.agent}` : ''}</div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{e.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
