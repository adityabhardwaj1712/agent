'use client';

import React, { useState } from 'react';
import { apiFetch, getToken } from '../lib/api';
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
  Terminal as TerminalIcon,
  Moon,
  Sun
} from 'lucide-react';
import { useToast } from './Toast';

const SECTIONS = [
  { id: 'profile', icon: User, label: 'User Profile' },
  { id: 'infrastructure', icon: Cpu, label: 'Neural Infrastructure' },
  { id: 'security', icon: Shield, label: 'Access & Security' },
  { id: 'notifications', icon: Bell, label: 'System Alerts' },
  { id: 'advanced', icon: Settings, label: 'Core Configuration' }
];

interface UserProfile {
  user_id: string;
  email: string;
  name: string;
  role: string;
}

interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  plain_secret?: string;
}

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile');
  const toast = useToast();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    if (activeTab === 'profile' && !currentUser) {
      apiFetch<UserProfile>('/auth/me').then(data => {
        setCurrentUser(data);
        setProfileName(data.name || '');
      }).catch(() => {});
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === 'infrastructure') {
      apiFetch<ApiKey[]>('/api_keys/').then(setApiKeys).catch(() => {});
    }
  }, [activeTab, refreshKey]);

  const saveProfile = async () => {
    try {
      await apiFetch('/auth/me', {
        method: 'PATCH',
        json: { name: profileName }
      });
      toast('Profile updated successfully', 'ok');
    } catch {
      toast('Failed to update profile', 'err');
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 8) return toast('New password must be at least 8 characters', 'err');
    if (!currentPassword) return toast('Current password is required', 'err');
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        json: { current_password: currentPassword, new_password: newPassword }
      });
      toast('Password updated successfully', 'ok');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update password';
      toast(msg, 'err');
    }
  };

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

           {SECTIONS.map((s: { id: string, icon: React.ElementType, label: string }) => (
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
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>{SECTIONS.find((s: any) => s.id === activeTab)?.label.toUpperCase()}</div>
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
                          {apiKeys.map(key => (
                              <div key={key.id} className="ms-key-row">
                                 <div className="flex items-center gap-3">
                                    <div className="ms-icon-box sm" style={{ background: 'rgba(59, 130, 246, 0.1)' }}><Key size={14} className="text-blue-400" /></div>
                                    <div>
                                       <div className="text-[12px] font-bold text-[var(--text)]">{key.label}</div>
                                       <div className="text-[10px] font-mono text-[var(--t3)]">{key.prefix}•••••••••••••</div>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <button className="ms-btn-icon-sm" onClick={async () => {
                                        await apiFetch(`/api_keys/${key.id}`, { method: 'DELETE' });
                                        setRefreshKey(r => r + 1);
                                        toast('API Key Revoked', 'ok');
                                    }}><Trash2 size={12} /></button>
                                 </div>
                              </div>
                          ))}

                          <button className="ms-btn ms-btn-g ms-btn-sm w-full border-dashed" style={{ height: '40px' }} onClick={async () => {
                              const name = prompt("Enter a label for your new API key:");
                              if (!name) return;
                              try {
                                 const res = await apiFetch<ApiKey>('/api_keys/', { method: 'POST', json: { label: name } });
                                 alert(`KEY CREATED.\n\nSave this raw secret now. You will NEVER see it again:\n\n${res.plain_secret}`);
                                 setRefreshKey(r => r + 1);
                              } catch {
                                 toast('Failed to generate key', 'err');
                              }
                          }}>
                             <Plus size={14} className="mr-2" /> CREATE_NEW_API_KEY
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

              {activeTab === 'advanced' && (
                 <div className="space-y-10">
                    <section className="ms-set-section">
                       <div className="title">Platform Appearance</div>
                       <div className="desc">Customize the user interface theme for optimal visibility.</div>
                       <div className="space-y-3">
                          <button 
                             className="ms-btn ms-btn-g w-full" 
                             style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', height: 'auto' }}
                             onClick={() => {
                                const current = document.documentElement.getAttribute('data-theme');
                                const next = current === 'dark' ? 'light' : 'dark';
                                document.documentElement.setAttribute('data-theme', next);
                                toast(`Theme switched to ${next.toUpperCase()} mode`, 'ok');
                             }}
                          >
                             <div className="flex items-center gap-3">
                                <Sun size={18} className="text-amber-400" />
                                <div style={{ textAlign: 'left' }}>
                                   <div className="font-bold text-[var(--text)]">Toggle System Theme</div>
                                   <div className="text-[11px] text-[var(--t3)] font-mono mt-1">SWITCH BETWEEN DARK AND LIGHT DISPLAY MODES</div>
                                </div>
                             </div>
                             <div className="ms-toggle on"></div>
                          </button>
                       </div>
                    </section>
                 </div>
              )}

              {activeTab === 'profile' && (
                 <div className="space-y-10">
                    <section className="ms-set-section">
                       <div className="title">User Identity</div>
                       <div className="desc">Configure your display name and view your platform role.</div>
                       
                       <div className="ms-input-grid">
                          <div className="ms-field">
                             <label>Display Name</label>
                             <input type="text" className="fi" value={profileName} onChange={e => setProfileName(e.target.value)} />
                          </div>
                          <div className="ms-field">
                             <label>Email Address</label>
                             <input type="text" className="fi" disabled value={currentUser?.email || ''} style={{ opacity: 0.6 }} />
                          </div>
                          <div className="ms-field">
                             <label>System Role</label>
                             <input type="text" className="fi" disabled value={currentUser?.role || ''} style={{ opacity: 0.6, border: '1px solid var(--blue)', color: 'var(--blue)' }} />
                          </div>
                          <div className="ms-field justify-end pb-1">
                             <button className="ms-btn ms-btn-p" style={{ height: '40px' }} onClick={saveProfile}>
                                <Save size={14} className="mr-2" /> Update Profile
                             </button>
                          </div>
                       </div>
                    </section>

                    <section className="ms-set-section text-red-500">
                       <div className="title" style={{ color: 'var(--red)' }}>Access Credentials</div>
                       <div className="desc">Change your cryptographic access token (password).</div>
                       
                       <div className="ms-input-grid">
                          <div className="ms-field">
                             <label>Current Password</label>
                             <input type="password" className="fi" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                          </div>
                          <div className="ms-field">
                             <label>New Password</label>
                             <input type="password" className="fi" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                          </div>
                          <div className="ms-field" />
                          <div className="ms-field justify-end pb-1">
                             <button className="ms-btn" style={{ height: '40px', background: 'rgba(255,50,50,0.1)', color: 'var(--red)', border: '1px solid var(--red)' }} onClick={changePassword}>
                                <Lock size={14} className="mr-2" /> Change Password
                             </button>
                          </div>
                       </div>
                    </section>
                 </div>
              )}

              {activeTab === 'notifications' && (
                 <div className="space-y-10">
                    <section className="ms-set-section">
                       <div className="title">System Alerts & Routing</div>
                       <div className="desc">Manage how operational telemetry and critical system warnings are delivered to your profile.</div>
                       <div className="space-y-3">
                          <div className="ms-toggle-row">
                             <div className="flex-1">
                                <div className="name">Critical Security Alerts</div>
                                <div className="sub">Push notifications for multi-tenant isolation breaches or API Key revocations.</div>
                             </div>
                             <div className="ms-toggle on"></div>
                          </div>
                          <div className="ms-toggle-row">
                             <div className="flex-1">
                                <div className="name">Autonomous Agent Lifecycle</div>
                                <div className="sub">Alerts when long-running workflows complete or encounter dead-letters.</div>
                             </div>
                             <div className="ms-toggle on"></div>
                          </div>
                          <div className="ms-toggle-row opacity-60">
                             <div className="flex-1">
                                <div className="name">Daily Analytic Digest</div>
                                <div className="sub">Aggregated system usage and token burn rate reports.</div>
                             </div>
                             <div className="ms-toggle off"></div>
                          </div>
                       </div>
                    </section>
                 </div>
              )}

              {activeTab !== 'profile' && activeTab !== 'infrastructure' && activeTab !== 'advanced' && activeTab !== 'notifications' && (
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
