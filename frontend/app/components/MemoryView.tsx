'use client';
import React, { useState } from 'react';
import Modal from './Modal';
import { useToast } from './Toast';

const INIT_MEMORIES = [
  { id: 'mem-001', agent: 'DataAnalyst', title: 'Q1 Sales Analysis Result', content: 'Q1 revenue increased 18.4% YoY. Top performing SKUs: A-112, B-243. Customer churn at 4.2%.', sim: 0.94, created: '2m ago' },
  { id: 'mem-002', agent: 'WebResearcher', title: 'Competitor Pricing Research', content: 'Competitor X charges $299/mo for team plan. Competitor Y offers usage-based billing at $0.002/token.', sim: 0.87, created: '1h ago' },
  { id: 'mem-003', agent: 'CodeHelper', title: 'Auth Middleware Bug', content: 'Bug in JWT refresh logic: missing await on async validation function causes race condition on concurrent requests.', sim: 0.91, created: '3h ago' },
  { id: 'mem-004', agent: 'ContentWriter', title: 'Blog Post Draft v1', content: 'Draft: "AI orchestration is transforming how teams coordinate complex workflows across distributed systems..."', sim: 0.76, created: '5h ago' },
  { id: 'mem-005', agent: 'TaskOrchestrator', title: 'Workflow WF-42 Execution Plan', content: 'Step 1: WebResearcher gathers data. Step 2: DataAnalyst processes. Step 3: ContentWriter drafts report.', sim: 0.89, created: '1d ago' },
  { id: 'mem-006', agent: 'SecurityGuardian', title: 'Security Incident Log', content: 'Detected 3 unauthorized tool calls from ag-004. Payload contained SQL injection pattern. Blocked and alerted.', sim: 0.98, created: '2d ago' },
];

export default function MemoryView() {
  const [memories, setMemories] = useState(INIT_MEMORIES);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const toast = useToast();

  const filtered = filter ? memories.filter(m => m.title.toLowerCase().includes(filter) || m.content.toLowerCase().includes(filter)) : memories;

  const addMemory = () => {
    if (!newContent.trim()) { toast('Memory content required', 'warn'); return; }
    setMemories(p => [{ id: `mem-${p.length + 1}`, agent: 'User', title: newContent.slice(0, 40), content: newContent, sim: +(Math.random() * 0.2 + 0.8).toFixed(2), created: 'just now' }, ...p]);
    setNewContent(''); setModalOpen(false);
    toast('Memory stored', 'ok');
  };

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="row gap-8">
        <input className="fi" style={{ maxWidth: 280 }} placeholder="Search memory..." onChange={e => setFilter(e.target.value.toLowerCase())} />
        <span className="pill" style={{ marginLeft: 'auto' }}><span className="dot dot-g"></span>pgvector: active</span>
        <button className="btn btn-g btn-sm" onClick={() => setModalOpen(true)}>+ Add Memory</button>
      </div>
      <div className="mem-grid">
        {filtered.map(m => (
          <div key={m.id} className="mem-card" onClick={() => toast(`Memory: ${m.id}`, 'info')}>
            <div className="mem-card-title">{m.title}</div>
            <div className="mem-card-text">{m.content.slice(0, 120)}{m.content.length > 120 ? '…' : ''}</div>
            <div className="embed-bar" style={{ width: `${Math.round(m.sim * 100)}%` }}></div>
            <div className="mem-card-meta">
              <span className="badge b-a">{m.agent}</span>
              <span>sim: {m.sim.toFixed(2)} · {m.created}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Memory Entry"
        footer={<><button className="btn btn-g" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-p" onClick={addMemory}>Store Memory</button></>}>
        <div className="fg"><label className="fl">Content</label><textarea className="ft" value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Memory content to store..." style={{ minHeight: 100 }} /></div>
      </Modal>
    </div>
  );
}
