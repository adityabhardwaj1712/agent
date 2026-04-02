'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Terminal as TerminalIcon, 
  History,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { useToast } from './Toast';
import { apiFetch } from '../lib/api';
import { usePolling } from '../lib/usePolling';

export default function ApprovalsView() {
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const data = await apiFetch<any[]>('/approvals');
      setPending(data.filter(a => a.status === 'pending') || []);
      setHistory(data.filter(a => a.status !== 'pending') || []);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 10000);

  useEffect(() => {
    fetchData();
  }, []);

  const approve = async (id: string) => {
    try {
      await apiFetch(`/approvals/${id}/approve`, { method: 'POST' });
      toast('Verification Successful: Task Resumed', 'ok');
      fetchData();
    } catch (err) {
      toast('Approval Matrix Error', 'err');
    }
  };

  const reject = async (id: string) => {
    try {
      await apiFetch(`/approvals/${id}/reject`, { method: 'POST' });
      toast('Security Override: Task Terminated', 'warn');
      fetchData();
    } catch (err) {
      toast('Rejection Matrix Error', 'err');
    }
  };

  if (loading) return (
    <div className="ms-content flex-center">
      <div className="ms-loader-ring"></div>
      <div style={{ marginTop: 20, color: 'var(--t3)', letterSpacing: '2px', fontSize: '10px' }}>SYNCHRONIZING_GUARDRAILS...</div>
    </div>
  );

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.6s ease-out' }}>
      {/* Header Info */}
      <div className="ms-glass-panel flex items-center justify-between" style={{ padding: '16px 24px' }}>
        <div className="flex items-center gap-4">
          <div className="ms-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <ShieldCheck size={20} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800 }}>HUMAN-IN-THE-LOOP CONTROL</div>
            <div style={{ fontSize: '10px', color: 'var(--t3)', letterSpacing: '1px' }}>SYSTEM_PROTOCOL: <span style={{ color: 'var(--green)' }}>ACTIVE_ENFORCEMENT</span></div>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--yellow)' }}>{pending.length}</div>
            <div style={{ fontSize: '9px', color: 'var(--t3)', textTransform: 'uppercase' }}>Alerts Pending</div>
          </div>
          <div className="text-right border-l border-[var(--bg3)] pl-8">
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--blue)' }}>{history.length}</div>
            <div style={{ fontSize: '9px', color: 'var(--t3)', textTransform: 'uppercase' }}>Verified Actions</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Pending Queue */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          {pending.length === 0 && (
            <div className="ms-glass-panel flex-center flex-col" style={{ padding: '60px', opacity: 0.6 }}>
               <Fingerprint size={48} style={{ color: 'var(--bg3)', marginBottom: 20 }} />
               <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)' }}>NO_SECURITY_EXCEPTIONS_FOUND</div>
            </div>
          )}
          {pending.map(a => (
            <div key={a.request_id} className="ms-glass-panel ms-approval-card">
              <div className="ms-approval-header">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={16} style={{ color: 'var(--yellow)' }} />
                  <span className="ms-approval-id">ID: {a.request_id.split('-')[0]}</span>
                </div>
                <div className="ms-badge ms-b-y">REQUIRED_VERIFICATION</div>
              </div>

              <div className="ms-approval-body">
                <div className="mb-4">
                  <div className="text-[13px] font-bold text-[var(--text)]">{a.operation}</div>
                  <div className="text-[10px] text-[var(--t3)] font-mono">TASK_REF: {a.task_id}</div>
                </div>

                <div className="ms-log-preview">
                  <div className="flex items-center gap-2 mb-2 text-[9px] text-[var(--blue)] font-bold">
                    <TerminalIcon size={10} /> OPERATION_PAYLOAD
                  </div>
                  <pre className="ms-code-block">{a.payload}</pre>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--bg3)]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User size={12} style={{ color: 'var(--t3)' }} />
                      <span style={{ fontSize: '10px', color: 'var(--t3)' }}>{a.agent_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={12} style={{ color: 'var(--t3)' }} />
                      <span style={{ fontSize: '10px', color: 'var(--t3)' }}>{new Date(a.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="ms-btn ms-btn-sm" style={{ background: 'var(--bg2)', borderColor: 'var(--bg3)', color: 'var(--t2)' }} onClick={() => reject(a.request_id)}>REJECT</button>
                    <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => approve(a.request_id)}>AUTHORIZE_ACTION</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* History Timeline */}
        <div className="ms-glass-panel flex flex-col overflow-hidden">
          <div className="ms-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg3)' }}>
            <div className="flex items-center gap-3">
              <History size={16} />
              <span style={{ fontSize: '12px', fontWeight: 800 }}>AUDIT_HISTORY</span>
            </div>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <div className="ms-timeline">
              {history.map((h, i) => (
                <div key={i} className="ms-timeline-item">
                  <div className={`ms-timeline-dot ${h.status}`}>
                    {h.status === 'approved' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  </div>
                  <div className="ms-timeline-content">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-[11px] font-bold uppercase">{h.status}</div>
                      <div className="text-[9px] text-[var(--t3)]">{new Date(h.created_at).toLocaleTimeString()}</div>
                    </div>
                    <div className="text-[10px] text-[var(--t2)] mb-1 line-clamp-1">{h.operation}</div>
                    <div className="text-[9px] text-[var(--t3)] font-mono">AGENT: {h.agent_id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ms-approval-card {
           border-left: 3px solid var(--yellow);
           background: linear-gradient(to right, rgba(245, 158, 11, 0.05), transparent);
        }
        .ms-approval-header {
          padding: 12px 20px;
          border-bottom: 1px solid var(--bg3);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ms-approval-id { font-size: 10px; font-weight: 700; color: var(--t3); font-family: var(--mono); }
        .ms-approval-body { padding: 20px; }
        
        .ms-log-preview {
          background: rgba(0,0,0,0.2);
          border-radius: 6px;
          padding: 12px;
          border: 1px solid var(--bg3);
        }
        .ms-code-block {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--t2);
          max-height: 100px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .ms-timeline { position: relative; padding-left: 20px; }
        .ms-timeline::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0; width: 1px; background: var(--bg3); }
        .ms-timeline-item { position: relative; margin-bottom: 24px; }
        .ms-timeline-dot {
          position: absolute;
          left: -20px;
          top: 0;
          width: 24px;
          height: 24px;
          background: var(--bg1);
          border: 1px solid var(--bg3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .ms-timeline-dot.approved { color: var(--green); border-color: var(--green); }
        .ms-timeline-dot.rejected { color: var(--red); border-color: var(--red); }
        
        .ms-timeline-content {
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid var(--bg3);
        }
      `}</style>
    </div>
  );
}
