'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Cpu, 
  Search, 
  ShieldCheck, 
  Trash2,
  Plus,
  Download,
  Upload,
  History,
  Activity
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';
import OptimizationHistory from './OptimizationHistory';

export default function AgentGallery() {
  const [agents, setAgents] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
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

  const calculateHealth = (agent: any) => {
    const successRate = agent.total_tasks > 0 ? (agent.successful_tasks / agent.total_tasks) * 100 : (agent.success_rate || 99);
    return Math.round(((agent.reputation_score || 98) * 0.4) + (successRate * 0.6));
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Terminate this agent?')) return;
    try {
      await apiFetch(`/agents/${id}`, { method: 'DELETE' });
      toast('Agent terminated', 'ok');
      fetchAgents();
      if (selectedAgentId === id) setSelectedAgentId(null);
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  const handleExport = async (agent: any) => {
    try {
      const data = await apiFetch<any>(`/agents/${agent.agent_id}/export`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agent.name}-config.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${agent.name} config`, 'ok');
    } catch (e: any) {
      toast('Export failed: ' + e.message, 'err');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        await apiFetch('/agents/import', { method: 'POST', body: JSON.stringify({...config, owner_id: 'demo-user'}) });
        toast('Agent config imported!', 'ok');
        fetchAgents();
      } catch (err: any) {
        toast('Import failed: ' + err.message, 'err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="ms-content flex-center">
        <div className="ms-loader-ring"></div>
        <div style={{ marginTop: 20, color: 'var(--t3)', letterSpacing: '2px', fontSize: '10px' }}>SYNCHRONIZING_FLEET_REGISTRY...</div>
      </div>
    );
  }

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(filter.toLowerCase()) || 
    a.role.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.8s ease-out' }}>
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-4">
            <div className={`ms-view-tab ${!selectedAgentId ? 'act' : ''}`} onClick={() => setSelectedAgentId(null)}>ACTIVE_FLEET</div>
            {selectedAgentId && (
              <div className="ms-view-tab act flex items-center gap-2">
                 <History size={12} /> MUTATION_LOG: {agents.find(a => a.agent_id === selectedAgentId)?.name}
              </div>
            )}
         </div>
         <div className="flex items-center gap-4">
            <button className="ms-btn ms-btn-g ms-btn-sm" onClick={() => (document.getElementById('import-input') as HTMLInputElement).click()}>
               <Upload size={14} className="mr-2" /> IMPORT_CONFIG
            </button>
            <input id="import-input" type="file" style={{ display: 'none' }} accept=".json" onChange={handleImport} />
            <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => (window as any).openAddAgent()}>
               <Plus size={14} className="mr-2" /> REGISTER_AGENT
            </button>
         </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedAgentId ? '1fr 420px' : '1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* Left: Search & Gallery */}
        <div className="flex flex-col gap-6 overflow-hidden">
          <div className="ms-glass-panel p-4 flex items-center gap-4">
             <div className="ms-icon-box" style={{ width: 32, height: 32, background: 'rgba(59, 130, 246, 0.1)' }}>
               <Search size={16} style={{ color: 'var(--blue)' }} />
             </div>
             <input 
               className="fi flex-1" 
               style={{ background: 'transparent', border: 'none', padding: 0 }} 
               placeholder="Search fleet by signature or directive..." 
               value={filter}
               onChange={e => setFilter(e.target.value)}
             />
          </div>

          <div className="ms-scroll" style={{ display: 'grid', gridTemplateColumns: selectedAgentId ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', alignContent: 'start', paddingBottom: 40 }}>
            {filteredAgents.map((agent) => {
              const health = calculateHealth(agent);
              const statusColor = health > 80 ? 'var(--green)' : health > 50 ? 'var(--yellow)' : 'var(--red)';
              const isSelected = selectedAgentId === agent.agent_id;
              const initials = agent.name.substring(0, 2).toUpperCase();
              
              return (
                <div 
                   key={agent.agent_id} 
                   className={`ms-glass-panel ms-agent-card group ${isSelected ? 'ms-card-selected' : ''}`}
                   style={{ borderLeft: `3px solid ${isSelected ? 'var(--blue)' : statusColor}` }}
                >
                   <div className="ms-agent-header">
                      <div className="flex items-center gap-4 flex-1">
                         <div className="ms-agent-avatar" style={{ background: isSelected ? 'var(--blue)' : 'var(--bg2)' }}>{initials}</div>
                         <div className="flex flex-col overflow-hidden">
                            <div className="ms-agent-name truncate">{agent.name}</div>
                            <div className="ms-agent-role truncate">ROLE: {(agent.role || 'UNASSIGNED').toUpperCase()}</div>
                         </div>
                      </div>
                      {agent.reputation_score > 90 && <ShieldCheck size={16} className="text-[var(--blue)] shrink-0" />}
                   </div>
                   
                   <div className="p-6 flex flex-col gap-6">
                      <p className="text-[11px] leading-relaxed text-[var(--t2)] h-[48px] line-clamp-2">{agent.description || 'Global mission directives pending assignment.'}</p>
                      
                      <div className="grid grid-cols-3 gap-3">
                         <div className="ms-mini-stat">
                            <div className="val">{agent.total_tasks || 0}</div>
                            <div className="lbl">TASKS</div>
                         </div>
                         <div className="ms-mini-stat">
                            <div className="val">{health}%</div>
                            <div className="lbl">HEALTH</div>
                         </div>
                         <div className="ms-mini-stat">
                            <div className="val">${agent.base_cost || 0}</div>
                            <div className="lbl">COST/T</div>
                         </div>
                      </div>

                      <div className="flex gap-3">
                         <button className="ms-btn ms-btn-sm flex-1" style={{ background: 'var(--bg2)' }} onClick={() => setSelectedAgentId(isSelected ? null : agent.agent_id)}>
                            <History size={14} className="mr-2" /> {isSelected ? 'HIDE_LOGS' : 'VIEW_MUTATIONS'}
                         </button>
                         <button className="ms-btn-icon-sm" onClick={() => handleExport(agent)}>
                            <Download size={14} />
                         </button>
                         <button className="ms-btn-icon-sm hover:text-[var(--red)]" onClick={() => deleteAgent(agent.agent_id)}>
                            <Trash2 size={14} />
                         </button>
                      </div>
                   </div>
                </div>
              );
            })}

            {filteredAgents.length === 0 && (
               <div className="ms-glass-panel flex-center flex-col py-32 opacity-30" style={{ gridColumn: '1 / -1', borderStyle: 'dashed' }}>
                  <Activity size={48} style={{ marginBottom: 20 }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: 2 }}>NO_SIGNAL_MATCHES_IN_SECTOR</div>
               </div>
            )}
          </div>
        </div>

        {/* Right: Mutation Sidepanel */}
        {selectedAgentId && (
          <div className="ms-glass-panel p-6 flex flex-col h-full overflow-hidden animate-ms-slide-in-right">
             <OptimizationHistory agentId={selectedAgentId} />
          </div>
        )}
      </div>

      <style jsx>{`
        .ms-agent-card {
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ms-agent-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.2); }
        .ms-card-selected { border-color: var(--blue) !important; background: rgba(59, 130, 246, 0.05); }
        
        .ms-agent-header {
           padding: 24px;
           border-bottom: 1px solid var(--bg3);
           display: flex;
           align-items: center;
           gap: 16px;
        }
        .ms-agent-avatar {
           width: 44px;
           height: 44px;
           border-radius: 12px;
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 14px;
           font-family: var(--mono);
           font-weight: 800;
           box-shadow: inset 0 0 12px rgba(255,255,255,0.05);
           flex-shrink: 0;
        }
        .ms-agent-name { font-size: 15px; font-weight: 800; color: var(--text); line-height: 1.2; }
        .ms-agent-role { font-size: 10px; color: var(--t3); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        
        .ms-mini-stat {
           background: var(--bg1);
           border: 1px solid var(--bg3);
           border-radius: 8px;
           padding: 10px 4px;
           text-align: center;
        }
        .ms-mini-stat .val { font-size: 13px; font-weight: 800; color: var(--text); font-family: var(--mono); }
        .ms-mini-stat .lbl { font-size: 8px; color: var(--t3); font-weight: 700; margin-top: 4px; letter-spacing: 0.5px; }
        
        .ms-btn-icon-sm { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--t3); transition: all 0.2s; background: var(--bg2); }
        .ms-btn-icon-sm:hover { background: var(--bg3); color: var(--text); }

        .ms-scroll {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--bg3) transparent;
        }
      `}</style>
    </div>
  );
}
