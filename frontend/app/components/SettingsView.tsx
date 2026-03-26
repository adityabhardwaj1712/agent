'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Shield, 
  Cpu, 
  Globe, 
  Bell, 
  Database, 
  Key, 
  Zap, 
  Lock,
  ChevronRight,
  Save,
  Trash2,
  RefreshCw,
  Plus,
  Terminal as TerminalIcon
} from 'lucide-react';
import { useToast } from './Toast';

const SECTIONS = [
  { id: 'profile', icon: User, label: 'User Profile' },
  { id: 'infrastructure', icon: Cpu, label: 'Neural Infrastructure' },
  { id: 'security', icon: Shield, label: 'Access & Security' },
  { id: 'notifications', icon: Bell, label: 'System Alerts' },
  { id: 'advanced', icon: Settings, label: 'Core Configuration' }
];

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('infrastructure');
  const toast = useToast();

  const save = () => {
    toast('System Configuration Synchronized', 'ok');
  };

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.8s ease-out', padding: '32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '40px', flex: 1 }}>
        
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-2">
           <div className="mb-6 px-4">
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--t3)', letterSpacing: '2px', textTransform: 'uppercase' }}>System_Configuration</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', marginTop: '4px' }}>CONTROL_PANEL</div>
           </div>

           {SECTIONS.map(s => (
              <button 
                key={s.id} 
                className={`ms-settings-tab ${activeTab === s.id ? 'active' : ''}`}
                onClick={() => setActiveTab(s.id)}
              >
                 <s.icon size={16} />
                 <span>{s.label}</span>
                 <ChevronRight size={14} className="ml-auto opacity-20" />
              </button>
           ))}

           <div className="mt-auto p-4 rounded-xl bg-[rgba(59,130,246,0.03)] border border-[rgba(59,130,246,0.05)]">
              <div className="flex items-center gap-2 mb-2">
                 <div className="ms-dot ms-dot-g"></div>
                 <span className="text-[10px] font-bold text-[var(--t3)]">SYS_CORE: NOMINAL</span>
              </div>
              <div className="text-[9px] text-[var(--t3)] font-mono">v2.4.0-release-stable</div>
           </div>
        </div>

        {/* Content Area */}
        <div className="ms-glass-panel flex flex-col overflow-hidden">
           <div className="ms-card-hd" style={{ padding: '24px 32px', borderBottom: '1px solid var(--bg3)' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>{SECTIONS.find(s => s.id === activeTab)?.label.toUpperCase()}</div>
              <button className="ms-btn ms-btn-p ms-btn-sm" onClick={save}>
                 <Save size={14} className="mr-2" /> Commit Changes
              </button>
           </div>

           <div className="p-8 overflow-y-auto flex-1">
              {activeTab === 'infrastructure' && (
                 <div className="space-y-10">
                    <section className="ms-set-section">
                       <div className="title">Neural Architecture</div>
                       <div className="desc">Configure the underlying LLM routing and reasoning engine priorities.</div>
                       
                       <div className="ms-input-grid">
                          <div className="ms-field">
                             <label>Default Reasoning Core</label>
                             <select className="fi">
                                <option>Llama 3.1 70B (High Precision)</option>
                                <option>Claude 3.5 Sonnet (Balanced)</option>
                                <option>GPT-4o (Large Context)</option>
                             </select>
                          </div>
                          <div className="ms-field">
                             <label>Auto-Scaling Threshold</label>
                             <div className="flex items-center gap-4">
                                <input type="range" className="ms-range" />
                                <span className="font-mono text-xs">85%</span>
                             </div>
                          </div>
                       </div>
                    </section>

                    <section className="ms-set-section">
                       <div className="title">API_KEY_INFRASTRUCTURE</div>
                       <div className="desc">Manage external service credentials and neural weights connectivity.</div>
                       
                       <div className="space-y-4">
                          <div className="ms-key-row">
                             <div className="flex items-center gap-3">
                                <div className="ms-icon-box sm" style={{ background: 'rgba(59, 130, 246, 0.1)' }}><Key size={14} className="text-blue-400" /></div>
                                <div>
                                   <div className="text-[12px] font-bold text-[var(--text)]">Anthropic Vector Cloud</div>
                                   <div className="text-[10px] font-mono text-[var(--t3)]">sk-ant-•••••••••••••21a</div>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button className="ms-btn-icon-sm"><RefreshCw size={12} /></button>
                                <button className="ms-btn-icon-sm"><Trash2 size={12} /></button>
                             </div>
                          </div>

                          <div className="ms-key-row">
                             <div className="flex items-center gap-3">
                                <div className="ms-icon-box sm" style={{ background: 'rgba(139, 92, 246, 0.1)' }}><Key size={14} className="text-violet-400" /></div>
                                <div>
                                   <div className="text-[12px] font-bold text-[var(--text)]">OpenAI Logic Bridge</div>
                                   <div className="text-[10px] font-mono text-[var(--red)]">INVALID_KEY_DETECTION</div>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button className="ms-btn-p ms-btn-sm" style={{ height: '28px', fontSize: '10px' }}>RESOLVE</button>
                             </div>
                          </div>

                          <button className="ms-btn ms-btn-g ms-btn-sm w-full border-dashed" style={{ height: '40px' }}>
                             <Plus size={14} className="mr-2" /> ADD_NEW_CREDENTIAL_CLUSTER
                          </button>
                       </div>
                    </section>

                    <section className="ms-set-section">
                       <div className="title">Advanced Axon Protocols</div>
                       <div className="desc">Low-level overrides for the inter-agent communication mesh.</div>
                       <div className="space-y-3">
                          <div className="ms-toggle-row">
                             <div className="flex-1">
                                <div className="name">Hyper-threaded Reasoning</div>
                                <div className="sub">Allow agents to branch logic paths concurrently.</div>
                             </div>
                             <div className="ms-toggle on"></div>
                          </div>
                          <div className="ms-toggle-row">
                             <div className="flex-1">
                                <div className="name">Circuit Breaker Persistence</div>
                                <div className="sub">Preserve agent state during unexpected node terminations.</div>
                             </div>
                             <div className="ms-toggle on"></div>
                          </div>
                          <div className="ms-toggle-row opacity-60">
                             <div className="flex-1">
                                <div className="name">Neural Pruning (BETA)</div>
                                <div className="sub">Automatically discard low-relevance memory embeddings.</div>
                             </div>
                             <div className="ms-toggle off"></div>
                          </div>
                       </div>
                    </section>
                 </div>
              )}

              {activeTab !== 'infrastructure' && (
                 <div className="flex-center flex-col py-32 h-full">
                    <TerminalIcon size={48} className="text-[var(--bg3)] mb-6" />
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--t3)', letterSpacing: '2px' }}>MODULE_SYNC_PENDING...</div>
                 </div>
              )}
           </div>
        </div>
      </div>

      <style jsx>{`
        .ms-settings-tab {
           display: flex;
           align-items: center;
           gap: 12px;
           padding: 12px 16px;
           border-radius: 10px;
           background: transparent;
           border: 1px solid transparent;
           color: var(--t2);
           font-size: 13px;
           font-weight: 500;
           transition: all 0.2s;
           cursor: pointer;
           text-align: left;
        }
        .ms-settings-tab:hover { background: rgba(255,255,255,0.03); color: var(--text); }
        .ms-settings-tab.active { 
           background: rgba(59, 130, 246, 0.08); 
           color: var(--blue); 
           font-weight: 700;
           border-color: rgba(59, 130, 246, 0.15);
        }

        .ms-set-section { margin-bottom: 48px; }
        .ms-set-section .title { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
        .ms-set-section .desc { font-size: 12px; color: var(--t3); margin-bottom: 24px; }

        .ms-input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .ms-field { display: flex; flex-direction: column; gap: 8px; }
        .ms-field label { font-size: 11px; font-weight: 800; color: var(--t2); text-transform: uppercase; letter-spacing: 0.5px; }

        .ms-key-row {
           display: flex;
           align-items: center;
           justify-content: space-between;
           padding: 16px 20px;
           background: rgba(255,255,255,0.02);
           border: 1px solid var(--bg3);
           border-radius: 12px;
        }

        .ms-toggle-row {
           display: flex;
           align-items: center;
           padding: 12px 16px;
           border-radius: 10px;
           transition: background 0.2s;
        }
        .ms-toggle-row:hover { background: rgba(255,255,255,0.02); }
        .ms-toggle-row .name { font-size: 13px; font-weight: 700; color: var(--text); }
        .ms-toggle-row .sub { font-size: 11px; color: var(--t3); margin-top: 2px; }

        .ms-toggle { width: 36px; height: 18px; border-radius: 20px; position: relative; cursor: pointer; transition: all 0.3s; }
        .ms-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 12px; height: 12px; border-radius: 50%; background: white; transition: all 0.3s; }
        .ms-toggle.on { background: var(--blue); box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
        .ms-toggle.on::after { left: 21px; }
        .ms-toggle.off { background: var(--bg3); }

        .ms-range { -webkit-appearance: none; width: 100%; height: 4px; background: var(--bg3); border-radius: 2px; outline: none; }
        .ms-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: var(--blue); border-radius: 50%; cursor: pointer; }
      `}</style>
    </div>
  );
}
