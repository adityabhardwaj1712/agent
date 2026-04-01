'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  Database, 
  Zap, 
  Clock, 
  Plus, 
  Filter, 
  ArrowRight,
  Info,
  Layers,
  Cpu
} from 'lucide-react';
import Modal from './Modal';
import { useToast } from './Toast';
import { apiFetch } from '../lib/api';

interface MemoryViewProps {
  refreshKey?: number;
}

export default function MemoryView({ refreshKey }: MemoryViewProps) {
  const [memories, setMemories] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchMemories = async (query = '') => {
    try {
      setLoading(true);
      const endpoint = query ? `/memory/search?agent_id=system&query=${encodeURIComponent(query)}` : '/memory/search?agent_id=system&query=';
      const data = await apiFetch<any>(endpoint);
      
      if (data && Array.isArray(data)) {
         setMemories(data);
      } else if (data && data.results) {
         setMemories(data.results);
         if (data.degraded && query) {
             toast('Vector DB unavailable. Using keyword search fallback.', 'warn');
         }
      } else {
         setMemories([]);
      }
    } catch (err) {
      console.error('Memory fetch failed:', err);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories(filter);
  };

  const addMemory = async () => {
    if (!newContent.trim()) { toast('Memory content required', 'warn'); return; }
    try {
      await apiFetch('/memory', {
        method: 'POST',
        body: JSON.stringify({ content: newContent })
      });
      setNewContent(''); 
      setModalOpen(false);
      toast('Neural Embedding Successful', 'ok');
      fetchMemories();
    } catch (err) {
      toast('Vector Injection Failed', 'err');
    }
  };

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.7s ease-out' }}>
      {/* Search & Header */}
      <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="ms-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Brain size={20} style={{ color: 'var(--violet)' }} />
            </div>
            <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input 
                className="fi" 
                style={{ width: '100%', paddingLeft: '40px', background: 'var(--bg1)', border: '1px solid var(--bg3)' }} 
                placeholder="Query neural vector space..." 
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </form>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="ms-badge ms-b-p" style={{ fontSize: '9px' }}>
               ENGINE: PGVECTOR-INDEX-1
            </div>
            <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => setModalOpen(true)}>
               <Plus size={14} className="mr-2" /> Inject Memory
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Results Grid */}
        <div className="overflow-y-auto pr-2">
          {loading ? (
            <div className="flex-center flex-col py-20 opacity-50">
               <div className="ms-loader-ring"></div>
               <div className="mt-4 text-[10px] tracking-[2px]">SCANNING_VECTOR_CLUSTERS...</div>
            </div>
          ) : memories.length === 0 ? (
            <div className="ms-glass-panel flex-center flex-col py-20" style={{ opacity: 0.5 }}>
               <Database size={48} style={{ color: 'var(--bg3)', marginBottom: 20 }} />
               <div style={{ fontSize: '13px', fontWeight: 600 }}>NO_NEURAL_RECORDS_FOUND</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {memories.map(m => (
                <div key={m.id} className="ms-glass-panel ms-memory-card group" onClick={() => toast(`Node: ${m.id}`, 'info')}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="ms-agent-tag"><Cpu size={10} className="mr-1" /> {m.agent || 'SYSTEM'}</div>
                    <span className="text-[9px] font-mono text-[var(--t3)] uppercase tracking-tight">ID: {m.id?.slice(0,8)}</span>
                  </div>
                  
                  <div className="ms-memory-content">
                    {m.content}
                  </div>
                  
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] text-[var(--t3)] uppercase flex items-center gap-1.5">
                        <Clock size={10} /> {new Date(m.created_at || Date.now()).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[var(--blue)]">REL: {m.relevance || '0.90'}</span>
                    </div>
                    <div className="ms-mini-progress">
                      <div className="ms-mini-progress-fill" style={{ width: `${(m.relevance || 0.90) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="ms-glass-panel flex flex-col p-6" style={{ height: 'fit-content' }}>
          <div className="flex items-center gap-2 mb-6">
            <Info size={16} style={{ color: 'var(--blue)' }} />
            <span style={{ fontSize: '12px', fontWeight: 800 }}>MEMORY_INDEX_INFO</span>
          </div>
          
          <div className="space-y-6">
            <div className="ms-info-row">
              <span className="label">Total Embeddings</span>
              <span className="value">{memories.length}</span>
            </div>
            <div className="ms-info-row">
              <span className="label">Vector Dim</span>
              <span className="value">1536 (OpenAI)</span>
            </div>
            <div className="ms-info-row">
              <span className="label">Index Type</span>
              <span className="value">HNSW / Cosine</span>
            </div>
            <div className="ms-info-row">
              <span className="label">Last Sync</span>
              <span className="value">Just now</span>
            </div>
          </div>

          <div className="mt-10 p-4 rounded-lg bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.1)]">
            <div className="flex gap-2 mb-2 text-[var(--blue)]">
              <Zap size={14} />
              <span className="text-[10px] font-bold uppercase">Pro Tip</span>
            </div>
            <p className="text-[10px] leading-relaxed text-[var(--t2)] italic">
              "Neural memory is shared across agents in the same fleet. Agents can learn from each other's historical executions."
            </p>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="MANUAL_VECTOR_INJECTION"
        footer={<><button className="ms-btn ms-btn-sm" style={{ background: 'var(--bg2)', borderColor: 'var(--bg3)' }} onClick={() => setModalOpen(false)}>ABORT</button><button className="ms-btn ms-btn-p ms-btn-sm" onClick={addMemory}>INJECT_KNOWLEDGE</button></>}>
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 700, letterSpacing: '1px' }}>RAW_KNOWLEDGE_PAYLOAD</label>
            <textarea 
               className="ft" 
               value={newContent} 
               onChange={e => setNewContent(e.target.value)} 
               placeholder="Enter unstructured text for semantic embedding..." 
               style={{ minHeight: 160, background: 'var(--bg1)', color: 'var(--text)', border: '1px solid var(--bg3)', borderRadius: '8px', padding: '12px', fontSize: '12px' }} 
            />
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .ms-memory-card {
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-top: 2px solid transparent;
        }
        .ms-memory-card:hover { 
          transform: translateY(-4px); 
          border-top-color: var(--violet);
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
        }
        .ms-memory-content {
          font-size: 13px;
          line-height: 1.6;
          color: var(--t2);
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 84px;
        }
        
        .ms-mini-progress { height: 2px; width: 100%; background: var(--bg3); border-radius: 4px; overflow: hidden; }
        .ms-mini-progress-fill { height: 100%; background: var(--blue); box-shadow: 0 0 8px var(--blue); }
        
        .ms-info-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--bg3); }
        .ms-info-row .label { font-size: 10px; color: var(--t3); text-transform: uppercase; letter-spacing: 0.5px; }
        .ms-info-row .value { font-size: 11px; font-weight: 700; color: var(--text); font-family: var(--mono); }
        
        .ms-agent-tag {
          font-size: 9px;
          font-family: var(--mono);
          color: var(--violet);
          background: rgba(139, 92, 246, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
