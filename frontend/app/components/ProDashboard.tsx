"use client";

import React, { useState, useEffect } from 'react';
import { Network, Activity, Cpu, Server, Play, Plus, Search, Terminal as TerminalIcon, RefreshCw } from 'lucide-react';
import ThreeDNetworkGraph from './ThreeDNetworkGraph';
import WorkflowCanvas from './WorkflowCanvas';
import { apiFetch, wsUrl } from '../lib/api';

const GEMMA_MODELS = [
  { id: 'ollama/gemma3-270m', name: 'Gemma 3 270M', desc: '550MB RAM, Edge Function Calling', icon: '📱' },
  { id: 'ollama/gemma3n-2b', name: 'Gemma 3n-2B', desc: '2GB RAM, PLE Architecture, Mobile-First', icon: '🔋' },
  { id: 'ollama/gemma3-4b', name: 'Gemma 3 4B', desc: 'Full Cloud Power, Comprehensive Tasks', icon: '☁️' },
  { id: 'ollama/embedding-gemma', name: 'EmbeddingGemma', desc: '<200MB, On-Device RAG', icon: '🔎' },
];

export default function ProDashboard() {
  const [activeTab, setActiveTab] = useState<'3d' | 'workflow'>('3d');
  const [selectedModel, setSelectedModel] = useState(GEMMA_MODELS[1].id);
  const [logs, setLogs] = useState<{ id: string, msg: string, time: string, type: string }[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Real-time telemetry link
    const ws = new WebSocket(wsUrl('/fleet'));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle full status updates or incremental changes
        if (data.active_agents !== undefined) {
          // It's a summary update
          setMetrics((p: any) => ({ ...p, ...data }));
        }
        
        // Add to log if it's a significant event
        const newLog = { 
          id: Date.now().toString(), 
          msg: data.msg || data.event || "Telemetry update received.", 
          time: new Date().toLocaleTimeString(), 
          type: data.level || 'info' 
        };
        setLogs(prev => [newLog, ...prev.slice(0, 14)]);
        
        // Refresh agents if a change is detected
        if (data.status_change || data.task_completed) {
          fetchData(); 
        }
      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };
    
    return () => ws.close();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsData, metricsData, analyticsData] = await Promise.all([
        apiFetch<any[]>('/agents/my'),
        apiFetch<any>('/analytics/fleet-health'),
        apiFetch<any>('/analytics/summary')
      ]);
      
      if (agentsData) setAgents(agentsData);
      if (metricsData) setMetrics(metricsData);
      
      // Use recent events/traces as logs
      if (analyticsData && analyticsData.active_events > 0) {
        // For now, let's just add a placeholder "Active Event Detected" if we have events
        // In a real app, we'd fetch a dedicated /logs or /traces endpoint
        const newLog = { 
          id: Date.now().toString(), 
          msg: `System Telemetry: ${analyticsData.active_events} active events detected.`, 
          time: new Date().toLocaleTimeString(), 
          type: 'info' 
        };
        setLogs(prev => [newLog, ...prev.slice(0, 9)]);
      }
    } catch (e) {
      console.error("Dashboard fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Network className="w-8 h-8 text-blue-500" />
            Unified Command Center
          </h1>
          <p className="text-slate-400 mt-1">Real-time 3D telemetry and Drag-and-Drop orchestration powered by local Gemma models.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('3d')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === '3d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            3D Graph
          </button>
          <button 
            onClick={() => setActiveTab('workflow')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'workflow' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Workflow Builder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Visualization Pane */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ minHeight: '500px' }}>
            {activeTab === '3d' ? <ThreeDNetworkGraph /> : <WorkflowCanvas />}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500" /> Fleet Agents Status</h3>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                onClick={() => (window as any).openAddAgent?.()}
              >
                <Plus className="w-4 h-4" /> Deploy New
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Agent</th>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                        No active agents found. Deploy a new agent to begin.
                      </td>
                    </tr>
                  ) : (
                    agents.map((agent: any) => (
                      <tr key={agent.agent_id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${agent.status === 'running' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div> 
                          {agent.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs">
                            {agent.model_name?.includes('/') ? agent.model_name.split('/')[1] : agent.model_name || 'default'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                             <div className="w-full max-w-[60px] bg-slate-700 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${agent.successful_tasks > 0 ? (agent.successful_tasks / agent.total_tasks * 100) : 100}%` }}></div>
                             </div>
                             <span className="text-[10px] text-slate-500">{agent.status || 'IDLE'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                           {agent.status === 'running' ? 'Active' : 'Standby'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Panel: Gemma & Logs */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg bg-gradient-to-br from-slate-900 to-indigo-950/30">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" /> Gemma Edge Integration
            </h3>
            <p className="text-xs text-slate-400 mb-4">Select local Google Gemma model for autonomous operations.</p>
            
            <div className="flex flex-col gap-2">
              {GEMMA_MODELS.map(m => (
                <div 
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedModel === m.id 
                    ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm text-slate-200">{m.icon} {m.name}</span>
                    {selectedModel === m.id && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>}
                  </div>
                  <p className="text-xs text-slate-400">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-0 shadow-lg flex-1 flex flex-col overflow-hidden min-h-[300px]">
            <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-white text-sm">Live Activity Log</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3 items-start opacity-90 hover:opacity-100 transition-opacity">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className="text-emerald-400 shrink-0">❯</span>
                  <span className="text-slate-300 break-words">{log.msg}</span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-slate-500 italic">Waiting for telemetry...</div>}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
