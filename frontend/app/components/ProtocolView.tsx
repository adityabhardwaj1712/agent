'use client';
import React, { useState } from 'react';
import { useToast } from './Toast';

const AGENTS = ['TaskOrchestrator', 'WebResearcher', 'DataAnalyst', 'CodeHelper', 'ContentWriter', 'SecurityGuardian', 'FleetSummarizer'];
const INIT_MSGS = [
  { from: 'TaskOrchestrator', to: 'WebResearcher', type: 'delegate_task', payload: 'Research Q2 market trends for e-commerce', t: '5m ago' },
  { from: 'WebResearcher', to: 'DataAnalyst', type: 'share_result', payload: 'Found 12 relevant articles. Summary attached.', t: '8m ago' },
  { from: 'DataAnalyst', to: 'TaskOrchestrator', type: 'share_result', payload: 'Analysis complete. Key insights: 3 growth areas identified.', t: '12m ago' },
  { from: 'SecurityGuardian', to: 'CodeHelper', type: 'request_memory', payload: 'Fetch last 10 tool calls for audit review', t: '15m ago' },
  { from: 'CodeHelper', to: 'SecurityGuardian', type: 'share_result', payload: 'Tool call history exported to audit log.', t: '18m ago' },
];

export default function ProtocolView() {
  const [msgs, setMsgs] = useState(INIT_MSGS);
  const [from, setFrom] = useState(AGENTS[0]);
  const [to, setTo] = useState(AGENTS[1]);
  const [type, setType] = useState('delegate_task');
  const [payload, setPayload] = useState('');
  const toast = useToast();

  const send = () => {
    if (!payload.trim()) { toast('Payload required', 'warn'); return; }
    setMsgs(p => [{ from, to, type, payload: payload.slice(0, 80), t: 'just now' }, ...p]);
    toast(`Message sent: ${from} → ${to}`, 'ok');
    setPayload('');
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-hd"><div className="card-hd-title">A2A Message Bus</div><div className="pill"><span className="dot dot-b dot-pulse"></span>Live</div></div>
          <div className="card-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {msgs.map((p, i) => (
              <div key={i} className="protocol-msg" onClick={() => toast('Protocol message viewed', 'info')}>
                <div className="pm-ava" style={{ background: 'var(--a)22', border: '1px solid var(--a)44' }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <div className="pm-from">{p.from} → <span style={{ color: 'var(--t2)' }}>{p.to}</span></div>
                  <div className="pm-body">{p.payload}</div>
                  <div className="pm-meta"><span className="badge b-a">{p.type}</span> · {p.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><div className="card-hd-title">Send Protocol Message</div></div>
          <div className="card-body">
            <div className="fg"><label className="fl">From Agent</label><select className="fs" value={from} onChange={e => setFrom(e.target.value)}>{AGENTS.map(a => <option key={a}>{a}</option>)}</select></div>
            <div className="fg"><label className="fl">To Agent</label><select className="fs" value={to} onChange={e => setTo(e.target.value)}>{AGENTS.map(a => <option key={a}>{a}</option>)}</select></div>
            <div className="fg"><label className="fl">Message Type</label><select className="fs" value={type} onChange={e => setType(e.target.value)}><option>delegate_task</option><option>request_memory</option><option>share_result</option><option>heartbeat</option></select></div>
            <div className="fg"><label className="fl">Payload</label><textarea className="ft" value={payload} onChange={e => setPayload(e.target.value)} placeholder='{"task":"Summarize the latest market report"}' /></div>
            <button className="btn btn-p" style={{ width: '100%' }} onClick={send}>Send Message →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
