'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export default function TracesView() {
  const [traces, setTraces] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [flame, setFlame] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTraces = async () => {
    try {
      const data = await apiFetch<any[]>('/traces');
      setTraces(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0].task_id);
      }
    } catch (err) {
      console.error('Traces fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlame = async (taskId: string) => {
    try {
      const data = await apiFetch<any[]>(`/traces/${taskId}/flame`);
      setFlame(data);
    } catch (err) {
      console.error('Flame fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchTraces();
  }, []);

  useEffect(() => {
    if (selectedTask) {
      fetchFlame(selectedTask);
    }
  }, [selectedTask]);

  const sbc: Record<string, string> = { completed: 'b-g', running: 'b-a', pending: 'b-y', failed: 'b-r' };
  const total = flame.reduce((s, x) => s + x.dur, 0);

  if (loading) return <div style={{ padding: 40, color: 'var(--t3)' }}>Collecting observability telemetry...</div>;

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card tbl-wrap">
        <div className="card-hd"><div className="card-hd-title">Execution Traces</div><div className="pill"><span className="dot dot-g"></span>Updated live</div></div>
        <table><thead><tr><th>Trace ID</th><th>Task</th><th>Agent</th><th>Step</th><th>Created</th><th>Status</th></tr></thead>
          <tbody>{traces.map(t => {
            return (
              <tr 
                key={t.trace_id} 
                onClick={() => setSelectedTask(t.task_id)}
                style={{ cursor: 'pointer', background: selectedTask === t.task_id ? 'var(--bg3)' : 'transparent' }}
              >
                <td className="mono-sm">{t.trace_id.slice(0,8)}</td>
                <td className="mono-sm">{t.task_id}</td>
                <td style={{ fontSize: 12 }}>{t.agent_id}</td>
                <td className="mono-sm">{t.step}</td>
                <td className="mono-sm">{new Date(t.created_at).toLocaleTimeString()}</td>
                <td><span className={`badge b-g`}>RECORDED</span></td>
              </tr>
            );
          })}</tbody></table>
      </div>

      {selectedTask && (
        <div className="card">
          <div className="card-hd"><div className="card-hd-title">Flame Graph — Task {selectedTask}</div></div>
          <div className="card-body" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
            {flame.length === 0 && <div style={{ color: 'var(--t3)', fontSize: 12 }}>No stages recorded for this task.</div>}
            <div style={{ marginBottom: 8, color: 'var(--t3)' }}>Total observable: {total.toFixed(2)}s</div>
            {flame.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <div style={{ width: 130, fontSize: 10.5, color: 'var(--t2)', textAlign: 'right', flexShrink: 0 }}>{s.name}</div>
                <div style={{ flex: 1, height: 18, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(s.dur / (total || 1) * 100)}%`, background: s.col, borderRadius: 4, opacity: 0.8 }}></div>
                </div>
                <div style={{ width: 50, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>{s.dur.toFixed(2)}s</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
