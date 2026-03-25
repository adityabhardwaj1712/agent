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

export default function MemoryView({ refreshKey }: { refreshKey?: number }) {
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
    toast('Memory stored successfully', 'ok');
  };

  return (
    <div className="ms-content">
      <div className="ms-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input 
              className="fi" 
              style={{ width: 320 }} 
              placeholder="Search neural vector space..." 
              onChange={e => setFilter(e.target.value.toLowerCase())} 
            />
            <div className="ms-badge ms-b-p">
               Vector Index: pgvector-v2
            </div>
          </div>
          <button className="ms-btn ms-btn-g ms-btn-sm" onClick={() => setModalOpen(true)}>
             + Sync New Vector
          </button>
        </div>

        <div className="ms-agent-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {filtered.map(m => (
            <div key={m.id} className="ms-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => toast(`Metadata: ${m.id}`, 'info')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="ms-badge ms-b-p">{m.agent}</div>
                <div style={{ color: 'var(--t3)', fontSize: '11px', fontFamily: 'var(--mono)' }}>{m.id}</div>
              </div>
              <div style={{ color: 'var(--t1)', fontWeight: 600, marginBottom: 8 }}>{m.title}</div>
              <div style={{ color: 'var(--t2)', fontSize: '13px', lineHeight: 1.5, marginBottom: 16, minHeight: '60px' }}>
                {m.content.slice(0, 140)}{m.content.length > 140 ? '…' : ''}
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', height: 2, borderRadius: 1, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ background: 'var(--blue)', width: `${Math.round(m.sim * 100)}%`, height: '100%', boxShadow: '0 0 8px var(--blue)' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--t3)', fontSize: '11px' }}>{m.created}</span>
                <span style={{ color: 'var(--blue)', fontSize: '11px', fontFamily: 'var(--mono)' }}>SIM {m.sim.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Manual Vector Injection"
        footer={<><button className="ms-btn ms-btn-g ms-btn-sm" onClick={() => setModalOpen(false)}>Abort</button><button className="ms-btn ms-btn-p ms-btn-sm" onClick={addMemory}>Inject Memory</button></>}>
        <div style={{ padding: '20px 0' }}>
          <div className="fg">
            <label className="fl">Neural Content</label>
            <textarea 
               className="ft" 
               value={newContent} 
               onChange={e => setNewContent(e.target.value)} 
               placeholder="Enter raw text for embedding..." 
               style={{ minHeight: 120, background: 'var(--bg1)', color: 'var(--t1)', border: '1px solid var(--bg3)' }} 
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
