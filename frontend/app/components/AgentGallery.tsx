'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Cpu, 
  Star, 
  Zap, 
  Search, 
  ShieldCheck, 
  MoreHorizontal, 
  Settings, 
  Terminal as TerminalIcon,
  Plus
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

export default function AgentGallery() {
  const [agents, setAgents] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const data = await apiFetch<any[]>('/agents');
      setAgents(data || []);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch agents', 'err');
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(filter.toLowerCase()) || 
    a.role.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="ms-content flex-center">
        <div className="ms-loader-ring"></div>
        <div style={{ marginTop: 20, color: 'var(--t3)', letterSpacing: '2px', fontSize: '10px' }}>SYNCHRONIZING_FLEET_REGISTRY...</div>
      </div>
    );
  }

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.8s ease-out' }}>
      {/* Registry Header */}
      <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="ms-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Cpu size={20} style={{ color: 'var(--blue)' }} />
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input 
                className="fi" 
                style={{ width: '100%', paddingLeft: '40px', background: 'var(--bg1)', border: '1px solid var(--bg3)' }} 
                placeholder="Search fleet by signature or directive..." 
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="ms-badge ms-b-p" style={{ fontSize: '10px' }}>
               FLEET_STATUS: NOMINAL
            </div>
            <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => (window as any).openAddAgent()}>
               <Plus size={14} className="mr-2" /> REGISTER_AGENT
            </button>
          </div>
        </div>
      </div>

      <div className="ms-agent-grid">
        {filteredAgents.map((agent) => {
          const initials = agent.name.substring(0, 2).toUpperCase();
          const hue = agent.name.length * 45; 
          const isError = agent.status === 'error';
          
          return (
            <div className="ms-glass-panel ms-agent-card group" key={agent.agent_id}>
              <div className="ms-agent-header">
                <div 
                  className="ms-agent-avatar" 
                  style={{ 
                    background: `linear-gradient(135deg, hsl(${hue},60%,15%), hsl(${hue},60%,25%))`,
                    border: `1px solid hsl(${hue},60%,40%)`,
                    color: `hsl(${hue},100%,80%)`
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="ms-agent-name">{agent.name}</div>
                  <div className="ms-agent-role">{agent.role}</div>
                </div>
                <button className="ms-btn-icon-sm"><Settings size={14} /></button>
              </div>
              
              <div className="ms-agent-body">
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="ms-mini-stat">
                    <div className="val">{agent.total_tasks || 0}</div>
                    <div className="lbl">OPERATIONS</div>
                  </div>
                  <div className="ms-mini-stat">
                    <div className="val">{agent.reputation_score || 98}%</div>
                    <div className="lbl">TRUST_IDX</div>
                  </div>
                  <div className="ms-mini-stat">
                    <div className="val" style={{ color: 'var(--green)' }}>{agent.success_rate || 99}%</div>
                    <div className="lbl">YIELD</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--bg3)]">
                  <div className="flex items-center gap-2">
                    <div className={`ms-dot ${isError ? 'ms-dot-r' : 'ms-dot-g'} animate-pulse`}></div>
                    <span className="text-[9px] font-bold text-[var(--t3)] uppercase tracking-widest">{agent.status || 'READY'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="ms-btn ms-btn-sm" style={{ background: 'var(--bg2)', padding: '0 12px', height: '28px', fontSize: '10px' }}>LOGS</button>
                    <button className="ms-btn ms-btn-sm" style={{ background: 'var(--bg2)', padding: '0 12px', height: '28px', fontSize: '10px' }}>TASKS</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAgents.length === 0 && (
           <div className="ms-glass-panel flex-center flex-col py-32" style={{ gridColumn: '1 / -1', borderStyle: 'dashed', opacity: 0.4 }}>
              <User size={48} style={{ color: 'var(--bg3)', marginBottom: 20 }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>NO_AGENTS_IN_CURRENT_SECTOR</div>
           </div>
        )}
      </div>

      <style jsx>{`
        .ms-agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        .ms-agent-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ms-agent-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.2); border-color: var(--blue); }
        
        .ms-agent-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--bg3);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ms-agent-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-family: var(--mono);
          font-weight: 800;
          box-shadow: inset 0 0 12px rgba(255,255,255,0.1);
        }
        .ms-agent-name { font-size: 15px; font-weight: 800; color: var(--text); line-height: 1.2; }
        .ms-agent-role { font-size: 10px; color: var(--t3); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        
        .ms-agent-body { padding: 24px; }
        
        .ms-mini-stat {
          background: var(--bg2);
          border: 1px solid var(--bg3);
          border-radius: 8px;
          padding: 8px;
          text-align: center;
        }
        .ms-mini-stat .val { font-size: 13px; font-weight: 800; color: var(--text); font-family: var(--mono); }
        .ms-mini-stat .lbl { font-size: 8px; color: var(--t3); font-weight: 700; margin-top: 2px; }
        
        .ms-btn-icon-sm { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--t3); transition: all 0.2s; }
        .ms-btn-icon-sm:hover { background: var(--bg3); color: var(--text); }
      `}</style>
    </div>
  );
}
