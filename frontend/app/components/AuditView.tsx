'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Activity, 
  Clock, 
  User, 
  Hash, 
  Globe, 
  AlertCircle, 
  CheckCircle2,
  Terminal as TerminalIcon,
  Download
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

interface AuditEntry {
  log_id: string;
  action: string;
  agent_id: string | null;
  task_id: string | null;
  detail: any;
  timestamp: string | null;
  ip_address: string | null;
}

export default function AuditView() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchAudit = async () => {
    try {
      const data = await apiFetch<AuditEntry[]>('/audit/logs');
      setEntries(data || []);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch audit logs', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 15000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = (ts: string | null) => {
    if (!ts) return '—';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'JUST_NOW';
    if (mins < 60) return `${mins}M_AGO`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}H_AGO`;
    return new Date(ts).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="ms-content flex-center">
        <div className="ms-loader-ring"></div>
        <div style={{ marginTop: 20, color: 'var(--t3)', letterSpacing: '2px', fontSize: '10px' }}>FETCHING_AUDIT_TRAILS...</div>
      </div>
    );
  }

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.6s ease-out' }}>
      {/* Audit Header Panel */}
      <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="ms-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Shield size={20} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>SYSTEM_AUDIT_PROTOCOL</div>
              <div style={{ fontSize: '10px', color: 'var(--t3)', letterSpacing: '1px' }}>LOG_LEVEL: <span style={{ color: 'var(--blue)' }}>VERBOSE</span> · RETENTION: <span style={{ color: 'var(--green)' }}>30D</span></div>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="ms-badge ms-b-p" style={{ fontSize: '10px' }}>
                LIVE_STREAMING: ACTIVE
             </div>
             <button className="ms-btn ms-btn-icon" title="Export Logs"><Download size={14} /></button>
          </div>
        </div>
      </div>

      <div className="ms-glass-panel flex flex-col" style={{ flex: 1, minHeight: 0 }}>
        <div className="ms-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg3)' }}>
           <div className="flex items-center gap-3">
              <FileText size={16} style={{ color: 'var(--t3)' }} />
              <span style={{ fontSize: '12px', fontWeight: 800 }}>IMMUTABLE_LOG_SEQUENCE</span>
           </div>
           <span className="text-[10px] font-mono text-[var(--t3)]">{entries.length} RECORDS_RETRIEVED</span>
        </div>

        <div className="ms-audit-scroll">
          {entries.length === 0 ? (
            <div className="flex-center flex-col py-32 opacity-30">
               <Activity size={48} style={{ marginBottom: 16 }} />
               <div style={{ fontSize: '12px', fontWeight: 600 }}>NO_AUDIT_SIGNALS_DETECTED</div>
            </div>
          ) : (
            <div className="ms-audit-table">
               {entries.map((e) => {
                 const isAlert = e.action.toLowerCase().includes('fail') || 
                                e.action.toLowerCase().includes('violation') || 
                                e.action.toLowerCase().includes('error');
                 return (
                   <div key={e.log_id} className="ms-audit-row group">
                     <div className="ms-audit-status">
                       {isAlert ? <AlertCircle size={14} style={{ color: 'var(--red)' }} /> : <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />}
                     </div>
                     
                     <div className="ms-audit-main">
                       <div className="ms-audit-action">{e.action.toUpperCase()}</div>
                       <div className="ms-audit-meta">
                         <span className="item"><User size={10} /> {e.agent_id ? e.agent_id.slice(0,8) : 'SYSTEM'}</span>
                         <span className="item"><Hash size={10} /> {e.task_id ? e.task_id.slice(0,8) : 'N/A'}</span>
                         <span className="item"><Globe size={10} /> {e.ip_address || 'INTERNAL'}</span>
                       </div>
                     </div>

                     <div className="ms-audit-time">
                       <Clock size={10} style={{ marginRight: '6px' }} />
                       {timeAgo(e.timestamp)}
                     </div>

                     <div className="ms-audit-expand">
                        <TerminalIcon size={12} style={{ color: 'var(--t3)', cursor: 'pointer' }} onClick={() => toast(`Log Reference: ${e.log_id}`, 'info')} />
                     </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ms-audit-scroll { flex: 1; overflow-y: auto; padding: 8px; }
        .ms-audit-table { display: flex; flex-direction: column; }
        
        .ms-audit-row { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          padding: 12px 16px; 
          border-bottom: 1px solid var(--bg3); 
          transition: background 0.2s;
        }
        .ms-audit-row:last-child { border-bottom: none; }
        .ms-audit-row:hover { background: rgba(255,255,255,0.02); }
        
        .ms-audit-status { width: 24px; display: flex; justify-content: center; }
        .ms-audit-main { flex: 1; min-width: 0; }
        .ms-audit-action { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--text); letter-spacing: -0.2px; }
        
        .ms-audit-meta { display: flex; gap: 16px; margin-top: 4px; }
        .ms-audit-meta .item { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--t3); font-weight: 500; font-family: var(--mono); }
        
        .ms-audit-time { font-family: var(--mono); font-size: 10px; color: var(--t3); display: flex; align-items: center; width: 100px; justify-content: flex-end; }
        .ms-audit-expand { width: 32px; display: flex; justify-content: center; opacity: 0; transition: opacity 0.2s; }
        .ms-audit-row:hover .ms-audit-expand { opacity: 1; }

        .ms-btn-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bg3); display: flex; align-items: center; justify-content: center; color: var(--t3); cursor: pointer; transition: all 0.2s; }
        .ms-btn-icon:hover { color: var(--text); border-color: var(--blue); }
      `}</style>
    </div>
  );
}
