"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch, wsUrl } from '../lib/api';
import WorkflowGraph from './WorkflowGraph';
import { 
  Play, 
  Rocket, 
  Layers, 
  ChevronRight, 
  Activity, 
  Zap, 
  Radio, 
  Target,
  Terminal as TerminalIcon,
  Cpu,
  MoreHorizontal
} from 'lucide-react';

interface Goal {
  goal_id: string;
  description: string;
  status: string;
  workflow_type: 'linear' | 'dag';
  workflow_json?: string;
  created_at: string;
}

const AutonomousView: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [workflowType, setWorkflowType] = useState<'linear' | 'dag'>('linear');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [missionLogs, setMissionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchGoals = async () => {
    setLoading(true); // Added setLoading(true)
    try {
      const data = await apiFetch<any[]>('/goals');
      setGoals(data || []); // Changed setMissions to setGoals
      if (data && data.length > 0 && !selectedGoalId) {
        setSelectedGoalId(data[0].goal_id);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissionTasks = async (goalId: string) => {
    setLoadingLogs(true);
    try {
      const data = await apiFetch<any[]>(`/goals/${goalId}/tasks`);
      // Map tasks to log format
      const logs = (data || []).map(t => ({
        id: t.task_id,
        msg: t.payload?.slice(0, 50) + '...',
        t: new Date(t.created_at).toLocaleTimeString(),
        st: t.status === 'completed' ? 'ok' : t.status === 'failed' ? 'err' : 'info'
      }));
      setMissionLogs(logs);
    } catch (err) {
      console.error('Failed to fetch mission tasks:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    if (selectedGoalId) {
      fetchMissionTasks(selectedGoalId);
      
      // Connect to Task WebSocket for real-time telemetry
      const ws = new WebSocket(wsUrl(`/task-stream/${selectedGoalId}`)); // Standardized helper

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'THOUGHT' || data.type === 'CHUNK') {
             const newLog = {
                id: Date.now().toString(),
                msg: data.type === 'THOUGHT' ? `THOUGHT: ${data.payload.step}` : data.payload,
                t: new Date().toLocaleTimeString(),
                st: data.type === 'THOUGHT' ? 'info' : 'ok'
             };
             setMissionLogs(prev => [newLog, ...prev.slice(0, 49)]);
             
             // If THOUGHT contains a step update, reflect it in the goals state
             if (data.type === 'THOUGHT' && data.payload.step) {
                setGoals(prev => prev.map(g => {
                   if (g.goal_id === selectedGoalId) {
                      // Optionally update node statuses if DAG
                   }
                   return g;
                }));
             }
          }
        } catch (e) { console.error("WS Parse Error", e); }
      };

      return () => ws.close();
    }
  }, [selectedGoalId]);

  const activeMission = goals.find(m => m.goal_id === selectedGoalId) || goals[0]; // Changed missions to goals

  const handleStartMission = async () => {
    if (!newGoalDesc.trim()) return;
    setLoading(true);
    try {
      await apiFetch('/goals/', {
        method: 'POST',
        body: JSON.stringify({ 
          description: newGoalDesc,
          workflow_type: workflowType
        })
      });
      setNewGoalDesc('');
      fetchGoals();
    } catch (e) {
      console.error('Failed to start mission:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ms-content" style={{ gap: '28px', animation: 'ms-fade-in 0.8s ease-out' }}>
      {/* Launch Control */}
      <div className="ms-glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Rocket size={120} style={{ color: 'var(--blue)', transform: 'rotate(45deg)' }} />
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="ms-icon-box" style={{ background: 'rgba(59, 130, 246, 0.15)', width: '48px', height: '48px' }}>
            <Radio className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>MISSION_COMMAND_V2</h2>
            <p style={{ fontSize: '10px', color: 'var(--t3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Autonomous Orchestration Engine</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex gap-3 p-1.5 bg-[var(--bg1)] rounded-xl border border-[var(--bg3)] w-fit">
            <button 
              onClick={() => setWorkflowType('linear')}
              className={`ms-btn-type ${workflowType === 'linear' ? 'active' : ''}`}
            >
              <Zap size={14} /> LINEAR_CHAIN
            </button>
            <button 
              onClick={() => setWorkflowType('dag')}
              className={`ms-btn-type ${workflowType === 'dag' ? 'active' : ''}`}
            >
              <Layers size={14} /> DAG_PARALLEL
            </button>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Target size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input 
                className="fi" 
                style={{ width: '100%', paddingLeft: '56px', height: '64px', fontSize: '18px', background: 'var(--bg2)', border: '1px solid var(--bg3)', borderRadius: '16px' }}
                placeholder="Declare high-level mission objectives..."
                value={newGoalDesc}
                onChange={(e) => setNewGoalDesc(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              className="ms-btn ms-btn-p"
              style={{ padding: '0 40px', borderRadius: '16px', height: '64px', fontSize: '14px', fontWeight: 800 }}
              onClick={handleStartMission}
              disabled={loading || !newGoalDesc.trim()}
            >
              {loading ? <Activity className="animate-spin" /> : 'INITIATE_PROTOCOL'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Missions */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="ms-dot ms-dot-g animate-pulse"></div>
             <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--t3)', letterSpacing: '2px' }}>LIVE_MISSIONS_FEED</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--t3)]">UDP_STREAM: SYNCED</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {goals.map(goal => {
            const dagData = goal.workflow_json ? JSON.parse(goal.workflow_json) : null;
            
            return (
              <div key={goal.goal_id} className="ms-glass-panel ms-mission-card group">
                <div className="ms-card-hd" style={{ padding: '20px 24px', borderBottom: '1px solid var(--bg3)' }}>
                  <div className="flex items-center gap-4">
                    <div className={`ms-status-indicator ${goal.status === 'completed' ? 'completed' : 'running'}`}></div>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{goal.description}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="ms-badge" style={{ background: 'var(--bg2)', color: 'var(--t3)', border: '1px solid var(--bg3)' }}>
                      {goal.workflow_type.toUpperCase()}
                    </div>
                    <div className={`ms-badge ${goal.status === 'completed' ? 'ms-b-g' : 'ms-b-p'}`}>
                      {goal.status.toUpperCase()}
                    </div>
                    {goal.workflow_type === 'dag' && !goal.workflow_json && (
                      <button 
                        className="ms-btn ms-btn-p py-1 px-3 text-[10px] h-auto" 
                        onClick={() => {}}
                        disabled={loading}
                      >
                        DECOMPOSE_MISSION
                      </button>
                    )}
                    <MoreHorizontal size={14} style={{ color: 'var(--t3)', cursor: 'pointer' }} />
                  </div>
                </div>

                <div className="p-24" style={{ padding: '24px' }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Visualization */}
                    <div>
                      {goal.workflow_type === 'dag' && dagData ? (
                        <div className="ms-graph-container">
                          <div className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Layers size={12} /> TOPOLOGICAL_GRAPH
                          </div>
                          <WorkflowGraph 
                            nodes={dagData.nodes.map((n: any) => ({
                              id: n.id,
                              description: n.label || n.description,
                              status: goal.status === 'completed' ? 'completed' : (selectedGoalId === goal.goal_id ? 'running' : 'pending')
                            }))} 
                            edges={dagData.edges.map((e: any) => ({
                              source: e.from || e.source,
                              target: e.to || e.target
                            }))} 
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Zap size={12} /> LOGIC_SEQUENCE
                          </div>
                          <div className="ms-sequence-item active">
                             <div className="num">01</div>
                             <div className="det">
                                <div className="tit">Planning Phase</div>
                                <div className="sub">Constructing execution chain from primitive tools</div>
                             </div>
                             <Activity size={12} className="animate-spin text-blue-400" />
                          </div>
                          <div className="ms-sequence-item opacity-40">
                             <div className="num">02</div>
                             <div className="det">
                                <div className="tit">Neural Search</div>
                                <div className="sub">Validating context from historical memory clusters</div>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-widest mb-4 flex items-center gap-2" onClick={() => setSelectedGoalId(goal.goal_id)} style={{ cursor: 'pointer' }}>
                         <TerminalIcon size={12} /> MISSION_TELEMETRY {selectedGoalId === goal.goal_id && <span className="text-[var(--blue)]">(ACTIVE)</span>}
                      </div>
                      <div className="ms-telemetry-stream">
                        {selectedGoalId === goal.goal_id && missionLogs.length > 0 ? (
                          missionLogs.map((log, li) => (
                            <div key={li} className={`line ${log.st === 'err' ? 'blink' : ''}`}>
                              <span className="ts">[{log.t}]</span> 
                              <span className={`tag ${log.st === 'ok' ? 'green' : log.st === 'err' ? 'yellow' : 'blue'}`}>
                                {log.st.toUpperCase()}
                              </span> 
                              {log.msg}
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="line"><span className="ts">[{new Date(goal.created_at).toLocaleTimeString()}]</span> <span className="tag blue">INFO</span> Protocol initiation sequence started...</div>
                            <div className="line"><span className="ts">[{new Date(goal.created_at).toLocaleTimeString()}]</span> <span className="tag violet">NEURAL</span> Context retrieved from Brain-Link.</div>
                            {selectedGoalId !== goal.goal_id && (
                              <div className="line italic text-[var(--t3)] mt-4">Click "MISSION_TELEMETRY" to activate stream for this goal.</div>
                            )}
                          </>
                        )}
                        {goal.status === 'completed' && missionLogs.length === 0 && (
                          <div className="line"><span className="ts">[{new Date().toLocaleTimeString()}]</span> <span className="tag green">DONE</span> Mission objectives secured.</div>
                        )}
                      </div>
                    </div>

                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-[var(--bg3)] flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <Cpu size={12} style={{ color: 'var(--t3)' }} />
                           <span style={{ fontSize: '10px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>SYSTEM_CORE_04</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span style={{ fontSize: '10px', color: 'var(--t3)' }}>LAUNCH: {new Date(goal.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>REF_ID: {goal.goal_id.slice(0,12)}</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {goals.length === 0 && (
            <div className="ms-glass-panel flex-center flex-col py-32" style={{ borderStyle: 'dashed', opacity: 0.4 }}>
              <Layers size={48} style={{ color: 'var(--bg3)', marginBottom: 24 }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>COMMAND_IDLE: AWAITING_INSTRUCTIONS</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ms-btn-type {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          color: var(--t3);
          transition: all 0.2s;
        }
        .ms-btn-type:hover { color: var(--text); background: var(--bg2); }
        .ms-btn-type.active { color: var(--text); background: var(--bg3); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        
        .ms-mission-card {
           transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ms-mission-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        
        .ms-status-indicator { width: 8px; height: 8px; border-radius: 50%; }
        .ms-status-indicator.running { background: var(--blue); box-shadow: 0 0 10px var(--blue); animation: ms-pulse 2s infinite; }
        .ms-status-indicator.completed { background: var(--green); box-shadow: 0 0 10px var(--green); }
        
        .ms-sequence-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg2);
          border: 1px solid var(--bg3);
          border-radius: 12px;
        }
        .ms-sequence-item .num { font-family: var(--mono); font-size: 11px; color: var(--blue); font-weight: 800; }
        .ms-sequence-item .det { flex: 1; }
        .ms-sequence-item .det .tit { font-size: 12px; font-weight: 800; margin-bottom: 2px; }
        .ms-sequence-item .det .sub { font-size: 10px; color: var(--t3); }
        
        .ms-telemetry-stream {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid var(--bg3);
          font-family: var(--mono);
          font-size: 11px;
          height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ms-telemetry-stream .line { color: var(--t2); line-height: 1.4; }
        .ms-telemetry-stream .ts { color: var(--t3); margin-right: 8px; }
        .ms-telemetry-stream .tag { font-size: 9px; font-weight: 800; border-radius: 3px; padding: 1px 4px; margin-right: 8px; }
        .ms-telemetry-stream .tag.blue { background: rgba(59, 130, 246, 0.2); color: var(--blue); }
        .ms-telemetry-stream .tag.violet { background: rgba(139, 92, 246, 0.2); color: var(--violet); }
        .ms-telemetry-stream .tag.green { background: rgba(16, 185, 129, 0.2); color: var(--green); }
        .ms-telemetry-stream .tag.yellow { background: rgba(245, 158, 11, 0.2); color: var(--yellow); }
        
        .blink { animation: ms-fade-in 1s infinite alternate; }
        
        @keyframes ms-pulse {
          0% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
};

export default AutonomousView;
