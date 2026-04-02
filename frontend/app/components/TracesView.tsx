'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Clock, 
  Cpu, 
  Layers, 
  Zap, 
  Terminal, 
  BarChart, 
  ChevronRight,
  Eye
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { usePolling } from '../lib/usePolling';

export default function TracesView() {
  const [traces, setTraces] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [flame, setFlame] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTraces = async () => {
    try {
      const data = await apiFetch<any[]>('/traces');
      setTraces(data || []);
      if (data && data.length > 0 && !selectedTask) {
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
      setFlame(data || []);
    } catch (err) {
      console.error('Flame fetch failed:', err);
    }
  };

  usePolling(fetchTraces, 10000);

  useEffect(() => {
    fetchTraces();
  }, []);

  useEffect(() => {
    if (selectedTask) {
      fetchFlame(selectedTask);
    }
  }, [selectedTask]);

  const total = flame.reduce((s, x) => s + x.dur, 0);

  if (loading) {
    return (
      <div className="ms-content flex-center">
        <div className="ms-loader-ring" style={{ borderTopColor: 'var(--violet)' }}></div>
        <div style={{ marginTop: 20, color: 'var(--t3)', letterSpacing: '2px', fontSize: '10px' }}>INITIALIZING_OBSERVABILITY_SURFACE...</div>
      </div>
    );
  }

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.7s ease-out' }}>
      
      {/* Top Controls */}
      <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="ms-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Activity size={20} style={{ color: 'var(--violet)' }} />
               </div>
               <div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>TRACE_OBSERVABILITY_MESH</div>
                  <div style={{ fontSize: '10px', color: 'var(--t3)', letterSpacing: '1px' }}>TELEMETRY_ENGINE: <span style={{ color: 'var(--violet)' }}>CONNECTED</span> · NODES: {traces.length}</div>
               </div>
            </div>
            
            <div className="flex gap-3">
               <div className="ms-pill bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                  <div className="ms-dot ms-dot-g animate-pulse"></div>
                  <span className="text-[10px] font-mono text-[var(--t2)] uppercase tracking-wider">Stream: Live</span>
               </div>
               <div className="relative" style={{ width: 240 }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input className="fi" style={{ width: '100%', paddingLeft: '36px', height: '36px', background: 'var(--bg1)' }} placeholder="Filter by trace identity..." />
               </div>
            </div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 450px', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* Trace List */}
        <div className="ms-glass-panel flex flex-col overflow-hidden">
          <div className="ms-task-table-container">
            <table className="ms-record-table">
              <thead>
                <tr>
                   <th>TRACE_ID</th>
                   <th>TARGET_AGENT</th>
                   <th>STEP_TAG</th>
                   <th>LATENCY</th>
                   <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {traces.map(t => (
                  <tr 
                    key={t.trace_id} 
                    onClick={() => setSelectedTask(t.task_id)}
                    className={`group ${selectedTask === t.task_id ? 'bg-[rgba(59,130,246,0.05)]' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <td><div className="ms-id-label">{t.trace_id.slice(0, 12)}</div></td>
                    <td><div className="name flex items-center gap-2"><Cpu size={12} className="text-[var(--t3)]" /> {t.agent_id}</div></td>
                    <td><div className="ms-mono-label">{t.step}</div></td>
                    <td><div className="ms-timestamp"><Clock size={10} className="mr-2" /> {new Date(t.created_at).toLocaleTimeString()}</div></td>
                    <td><div className="ms-badge ms-b-g">RECORDED</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flame Graph / Details */}
        <div className="flex flex-col gap-6">
          <div className="ms-glass-panel flex flex-col p-6" style={{ height: '100%' }}>
            <div className="flex items-center gap-3 mb-8 pb-4 border-bottom border-[rgba(255,255,255,0.05)]">
               <BarChart size={18} style={{ color: 'var(--violet)' }} />
               <span style={{ fontSize: '12px', fontWeight: 800 }}>LATENCY_FLAME_GRAPH</span>
            </div>

            {selectedTask ? (
              <div className="flex flex-col flex-1">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                       <div className="text-[10px] text-[var(--t3)] font-bold uppercase tracking-widest mb-1">Observation Reference</div>
                       <div className="text-sm font-mono text-[var(--blue)]">{selectedTask}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] text-[var(--t3)] font-bold uppercase tracking-widest mb-1">Total Wait</div>
                       <div className="text-xl font-black text-white">{total.toFixed(2)}s</div>
                    </div>
                 </div>

                 <div className="ms-flame-container flex-1">
                    {flame.length === 0 ? (
                       <div className="flex-center flex-col h-full opacity-20">
                          <Layers size={32} />
                          <div className="mt-4 text-[10px] font-bold">NO_SUB_STAGES_RESOLVED</div>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          {flame.map((s, i) => (
                             <div key={i} className="group">
                                <div className="flex justify-between items-center mb-1.5 px-1">
                                   <div className="text-[10px] font-bold text-[var(--t3)] uppercase flex items-center gap-2">
                                      <ChevronRight size={10} className="text-[var(--violet)]" /> {s.name}
                                   </div>
                                   <div className="text-[10px] font-mono text-[var(--t2)]">{s.dur.toFixed(2)}s</div>
                                </div>
                                <div className="ms-flame-track">
                                   <div 
                                      className="ms-flame-bar" 
                                      style={{ 
                                         width: `${Math.round(s.dur / (total || 1) * 100)}%`,
                                         background: `linear-gradient(90deg, ${s.col || 'var(--violet)'}, transparent)`,
                                         boxShadow: `0 0 10px ${s.col || 'rgba(139,92,246,0.3)'}`
                                      } as any}
                                   ></div>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)]">
                    <button className="ms-btn ms-btn-p w-full" style={{ height: '44px', fontSize: '11px', fontWeight: 800 }}>
                       DOWNLOAD_FULL_TRACE_JSON <Terminal size={12} className="ml-2" />
                    </button>
                 </div>
              </div>
            ) : (
              <div className="flex-center flex-col flex-1 opacity-10">
                 <Eye size={64} />
                 <div className="mt-6 text-sm font-black">SELECT_TRACE_ENTITY</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .ms-task-table-container { flex: 1; overflow-y: auto; }
        .ms-record-table { width: 100%; border-collapse: collapse; text-align: left; }
        
        .ms-record-table th { 
          padding: 16px 24px; 
          background: rgba(255,255,255,0.02); 
          border-bottom: 1px solid var(--bg3); 
          font-size: 10px; 
          color: var(--t3); 
          font-weight: 800; 
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        
        .ms-record-table td { padding: 16px 24px; border-bottom: 1px solid var(--bg3); vertical-align: middle; }
        .ms-record-table tr td .name { font-size: 13px; font-weight: 700; color: var(--text); }
        
        .ms-id-label { font-family: var(--mono); font-size: 11px; color: var(--blue); font-weight: 700; background: rgba(59, 130, 246, 0.08); padding: 4px 10px; border-radius: 6px; display: inline-block; }
        .ms-mono-label { font-family: var(--mono); font-size: 11px; color: var(--t3); background: var(--bg2); padding: 2px 8px; border-radius: 4px; display: inline-block; }
        .ms-timestamp { font-size: 11px; font-family: var(--mono); color: var(--t3); display: flex; align-items: center; }

        .ms-flame-container { overflow-y: auto; padding-right: 4px; }
        .ms-flame-track { height: 12px; background: rgba(255,255,255,0.03); border-radius: 100px; overflow: hidden; position: relative; }
        .ms-flame-bar { height: 100%; border-radius: 100px; transition: width 0.8s cubic-bezier(0.2, 0, 0.2, 1); }
      `}</style>
    </div>
  );
}
