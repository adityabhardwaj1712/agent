'use client';

import React, { useState, useEffect } from 'react';
import { 
  List, 
  RefreshCw, 
  Plus, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Compass,
  FileText,
  Search,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';
import AddTaskModal from './AddTaskModal';

export default function TaskTable() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{task_id: string, analysis: string, fix_suggestion: string} | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await apiFetch<any[]>('/tasks');
      setTasks(data || []);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch tasks', 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (taskId: string) => {
    setAnalyzing(taskId);
    setAnalysisResult(null);
    try {
      const res = await apiFetch<any>(`/tasks/${taskId}/root-cause`);
      setAnalysisResult({ task_id: taskId, ...res });
    } catch (err: any) {
      toast('Failed to analyze task: ' + err.message, 'err');
    } finally {
      setAnalyzing(null);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Connect to Real-time WebSockets
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//localhost:8000/ws/tasks`);
    
    ws.onmessage = (event) => {
      try {
        fetchTasks(); // Refresh tasks automatically
      } catch (e) {}
    };

    return () => ws.close();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <div className="ms-badge ms-b-g"><CheckCircle2 size={10} className="mr-1.5" /> COMPLETED</div>;
      case 'failed': return <div className="ms-badge ms-b-r"><XCircle size={10} className="mr-1.5" /> FAILED</div>;
      case 'pending': return <div className="ms-badge ms-b-y"><Clock size={10} className="mr-1.5" /> PENDING</div>;
      case 'in_progress': return <div className="ms-badge ms-b-b"><Activity size={10} className="animate-spin mr-1.5" /> RUNNING</div>;
      default: return <div className="ms-badge" style={{ background: 'var(--bg2)', color: 'var(--t3)' }}>{status.toUpperCase()}</div>;
    }
  };

  if (loading) {
    return (
      <div className="ms-content flex-center">
        <div className="ms-loader-ring" style={{ borderTopColor: 'var(--cyan)' }}></div>
        <div style={{ marginTop: 20, color: 'var(--t3)', letterSpacing: '2px', fontSize: '10px' }}>ACCESSING_EXECUTION_REGISTRY...</div>
      </div>
    );
  }

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.7s ease-out' }}>
      {/* Header Controls */}
      <div className="ms-glass-panel" style={{ padding: '20px 24px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="ms-icon-box" style={{ background: 'rgba(34, 211, 238, 0.1)' }}>
               <List size={20} style={{ color: 'var(--cyan)' }} />
            </div>
            <div>
               <div style={{ fontSize: '14px', fontWeight: 800 }}>TASK_ORCHESTRATION_HISTORY</div>
               <div style={{ fontSize: '10px', color: 'var(--t3)', letterSpacing: '1px' }}>SYNC_STATUS: <span style={{ color: 'var(--green)' }}>LIVE (WS)</span> · REGISTRY: LOCAL_SQLITE</div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <div className="relative" style={{ width: 280 }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                <input className="fi" style={{ width: '100%', paddingLeft: '36px', height: '36px', background: 'var(--bg1)' }} placeholder="Filter by operation signature..." />
             </div>
             <button className="ms-btn ms-btn-icon" onClick={fetchTasks} title="Synchronize Registry"><RefreshCw size={14} /></button>
             <button className="ms-btn ms-btn-p" style={{ height: '36px', padding: '0 20px', fontSize: '11px', fontWeight: 800 }} onClick={() => setIsModalOpen(true)}>
                <Plus size={14} className="mr-2" /> NEW_TASK_DEPLOY
             </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="ms-glass-panel flex flex-col" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className="ms-task-table-container">
          <table className="ms-record-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>ID_REF</th>
                <th>DIRECTIVE_DESCRIPTION</th>
                <th style={{ width: 160 }}>EXECUTION_STATE</th>
                <th style={{ width: 180 }}>TIMESTAMP</th>
                <th style={{ width: 140 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                   <td colSpan={5}>
                      <div className="flex-center flex-col py-32 opacity-30">
                         <Compass size={48} style={{ marginBottom: 16 }} />
                         <div style={{ fontSize: '12px', fontWeight: 600 }}>NO_TASK_SIGNALS_DETECTED_IN_SECTOR</div>
                      </div>
                   </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.task_id} className="group">
                    <td>
                      <div className="ms-id-label">{task.task_id.substring(0, 12)}</div>
                    </td>
                    <td>
                      <div className="ms-task-desc">{task.description}</div>
                    </td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>
                      <div className="ms-timestamp">
                        <Calendar size={10} className="mr-2" />
                        {new Date(task.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td>
                       <div className="flex items-center gap-2">
                         {task.status.toLowerCase() === 'failed' && (
                           <button 
                             className="ms-btn ms-btn-sm" 
                             style={{ background: 'rgba(255,45,78,0.1)', color: 'var(--red)', border: '1px solid rgba(255,45,78,0.2)' }}
                             disabled={analyzing === task.task_id}
                             onClick={() => handleAnalyze(task.task_id)}
                           >
                             <Activity size={12} className={analyzing === task.task_id ? 'animate-spin mr-1' : 'mr-1'}/>
                             {analyzing === task.task_id ? 'ANALYZING' : 'ANALYZE'}
                           </button>
                         )}
                         <button className="ms-btn-icon-sm"><MoreHorizontal size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {analysisResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ms-glass-panel" style={{ width: 600, maxWidth: '90vw', border: '1px solid var(--red)' }}>
            <div className="ms-card-hd" style={{ borderBottomColor: 'rgba(255,45,78,0.2)' }}>
              <div className="flex items-center gap-2 text-[var(--red)] font-bold">
                <AlertTriangle size={18} /> ROOT CAUSE ANALYSIS
              </div>
              <button className="ms-icon-btn red" onClick={() => setAnalysisResult(null)}><XCircle size={16} /></button>
            </div>
            <div className="p-6">
              <div style={{ fontSize: '11px', color: 'var(--t3)', fontFamily: 'var(--mono)', marginBottom: '16px' }}>TARGET_ID: {analysisResult.task_id}</div>
              
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--t2)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={14} /> DIAGNOSIS
                </h4>
                <div style={{ background: 'var(--bg1)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--red)', fontSize: '13px', lineHeight: 1.6 }}>
                  {analysisResult.analysis}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--green)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} /> RECOMMENDED FIX
                </h4>
                <div style={{ background: 'rgba(0,232,149,0.05)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--green)', fontSize: '13px', lineHeight: 1.6, color: 'var(--t1)' }}>
                  {analysisResult.fix_suggestion}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdded={fetchTasks} 
      />

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
        .ms-record-table tr:last-child td { border-bottom: none; }
        .ms-record-table tr:hover { background: rgba(255,255,255,0.015); }
        
        .ms-id-label { font-family: var(--mono); font-size: 11px; color: var(--blue); font-weight: 700; background: rgba(59, 130, 246, 0.08); padding: 4px 10px; border-radius: 6px; display: inline-block; }
        .ms-task-desc { font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
        .ms-timestamp { font-size: 11px; font-family: var(--mono); color: var(--t3); display: flex; align-items: center; }
        
        .ms-btn-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg2); border: 1px solid var(--bg3); color: var(--t3); transition: all 0.2s; }
        .ms-btn-icon:hover { color: var(--text); border-color: var(--blue); }
        
        .ms-btn-icon-sm { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--t3); transition: all 0.2s; }
        .ms-btn-icon-sm:hover { background: var(--bg3); color: var(--text); }
      `}</style>
    </div>
  );
}
