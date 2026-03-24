'use client';
import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { apiFetch } from '../lib/api';

export default function ApprovalsView() {
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const data = await apiFetch<any[]>('/approvals');
      setPending(data.filter(a => a.status === 'pending'));
      setHistory(data.filter(a => a.status !== 'pending'));
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approve = async (id: string) => {
    try {
      await apiFetch(`/approvals/${id}/approve`, { method: 'POST' });
      toast('Action approved — task resumed', 'ok');
      fetchData();
    } catch (err) {
      toast('Approval failed', 'err');
    }
  };

  const reject = async (id: string) => {
    try {
      await apiFetch(`/approvals/${id}/reject`, { method: 'POST' });
      toast('Action rejected — task cancelled', 'warn');
      fetchData();
    } catch (err) {
      toast('Rejection failed', 'err');
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--t3)' }}>Loading security checkpoints...</div>;

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div className="card-hd"><div><div className="card-hd-title">Pending Approvals</div><div className="card-hd-sub">Human-in-the-loop checkpoints</div></div></div>
        <div className="card-body">
          {pending.length === 0 && <div style={{ color: 'var(--t3)', fontSize: 12 }}>No pending approvals 🎉</div>}
          {pending.map(a => (
            <div key={a.request_id} style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid rgba(245,158,11,.3)` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="badge b-y">VERIFICATION REQUIRED</span>
                    <span className="mono-sm">{a.request_id.slice(0,8)} · {a.task_id}</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>{a.operation}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>Requested by: {a.agent_id} · {new Date(a.created_at).toLocaleString()}</div>
                  <pre style={{ fontSize: 10, background: 'var(--bg1)', padding: 6, borderRadius: 4, marginTop: 8, color: 'var(--t2)', overflow: 'auto' }}>{a.payload}</pre>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-p btn-sm" onClick={() => approve(a.request_id)}>✓ Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => reject(a.request_id)}>✕ Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-hd-title">Approval History</div></div>
        <div className="card-body">
          <div className="timeline">
            {history.map((h, i) => (
              <div key={i} className="tl-item">
                <div className={`tl-dot ${h.status === 'approved' ? 'tl-dot-g' : 'tl-dot-r'}`}>{h.status === 'approved' ? '✓' : '✕'}</div>
                <div className="tl-content">
                  <div className="tl-title">{h.operation} for {h.task_id}</div>
                  <div className="tl-meta">Status: {h.status.toUpperCase()} · {h.agent_id} · {new Date(h.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
