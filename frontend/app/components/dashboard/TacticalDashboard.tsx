'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Activity, 
  Cpu, 
  Zap, 
  Target, 
  Radio, 
  Terminal, 
  Layers, 
  Globe, 
  RefreshCw,
  Clock,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { apiFetch, wsUrl } from '../../lib/api';

// --- Sub-components ---

const StatCard = ({ label, value, sub, color, icon: Icon }: any) => (
  <div className="tactical-card group overflow-hidden relative">
    <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500/50`} />
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-[10px] font-black text-white/30 uppercase tracking-[2px] mb-1">{label}</div>
        <div className="text-2xl font-black text-white tracking-tighter leading-none">{value}</div>
      </div>
      <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20 group-hover:scale-110 transition-transform`}>
        <Icon size={16} className={`text-${color}-400`} />
      </div>
    </div>
    <div className="text-[10px] font-mono text-white/40 flex items-center gap-2">
       <span className={`w-1.5 h-1.5 rounded-full bg-${color}-500 animate-pulse`} />
       {sub}
    </div>
  </div>
);

const TacticalDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({
    active_agents: 0,
    total_tasks: 0,
    success_rate: 0,
    active_events: 0,
    total_cost: 0
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [clock, setClock] = useState('--:--:--');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const [sData, tData] = await Promise.all([
        apiFetch<any>('/analytics/summary'),
        apiFetch<any[]>('/tasks/?limit=10')
      ]);
      setStats(sData);
      setTasks(tData || []);
    } catch (e) {
      console.error("Dashboard Sync Failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    const clockInterval = setInterval(() => {
      setClock(new Date().toTimeString().split(' ')[0]);
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  return (
    <div className="tactical-container animate-fade-in p-8">
      {/* Header HUD */}
      <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <div className="text-[10px] font-black tracking-[4px] text-cyan-500/80 uppercase">Tactical_Command_Center_V4.2</div>
           </div>
           <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Unified_Fleet_Ops</h1>
        </div>
        <div className="flex gap-8 items-center font-mono">
           <div className="text-right">
              <div className="text-[10px] text-white/30 uppercase">System_Time</div>
              <div className="text-xl text-white font-bold">{clock}</div>
           </div>
           <div className="text-right">
              <div className="text-[10px] text-white/30 uppercase">Sync_Status</div>
              <div className={`text-xl font-bold ${isSyncing ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isSyncing ? 'RE-SYNCING' : 'OPTIMAL'}
              </div>
           </div>
           <button onClick={fetchData} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95">
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* KPI Row (Top) */}
        <div className="col-span-3">
           <StatCard 
             label="Assigned_Workers" 
             value={stats.active_agents} 
             sub="Neural_Bridges_Active" 
             color="blue" 
             icon={Cpu} 
           />
        </div>
        <div className="col-span-3">
           <StatCard 
             label="Throughput_Hz" 
             value={stats.total_tasks} 
             sub="Operations_Log_Total" 
             color="cyan" 
             icon={Zap} 
           />
        </div>
        <div className="col-span-3">
           <StatCard 
             label="Precision_Rate" 
             value={`${(stats.success_rate * 100).toFixed(1)}%`} 
             sub="Error_Threshold_Minimal" 
             color="emerald" 
             icon={Target} 
           />
        </div>
        <div className="col-span-3">
           <StatCard 
             label="Resource_Drain" 
             value={`$${stats.total_cost?.toFixed(2)}`} 
             sub="Credit_Burn_Rate_Normal" 
             color="amber" 
             icon={Activity} 
           />
        </div>

        {/* Central Visualization (Topology) */}
        <div className="col-span-8 row-span-2 tactical-card relative min-h-[500px] border-[#2e6fff]/20 bg-[#2e6fff]/5">
           <div className="absolute top-6 left-6 z-10">
              <div className="text-[12px] font-black tracking-widest text-[#2e6fff] uppercase mb-1">Global_Node_Topology</div>
              <div className="text-[10px] text-white/40 font-mono italic">Rendering_Engine: WebGL_Core</div>
           </div>
           
           {/* Placeholder for complex 3D graph - using SVG for crisp tactical look */}
           <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <Globe size={300} className="text-[#2e6fff] animate-spin-slow" strokeWidth={0.5} />
           </div>

           <div className="absolute bottom-6 right-6 flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500" />
                 <span className="text-[9px] font-mono text-white/60">ACTIVE_NODE</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500" />
                 <span className="text-[9px] font-mono text-white/60">CRITICAL_FAIL</span>
              </div>
           </div>
        </div>

        {/* Real-time Telemetry (Right) */}
        <div className="col-span-4 row-span-2 tactical-card flex flex-col bg-black/40">
           <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="text-[12px] font-black tracking-widest text-white uppercase">Live_Telemetry</div>
              <Radio size={14} className="text-cyan-400 animate-pulse" />
           </div>
           <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-3 custom-scrollbar">
              {tasks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/20 italic">
                   Awaiting_Uplink_Data...
                </div>
              ) : (
                tasks.map((t, i) => (
                  <div key={t.task_id} className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-lg group hover:border-[#2e6fff]/40 transition-colors">
                     <div className="text-white/30">[{new Date(t.created_at).toLocaleTimeString([], { hour12: false })}]</div>
                     <div className="flex-1">
                        <div className="text-white/80 font-bold mb-1">TASK_ID: {t.task_id.slice(0, 8)}</div>
                        <div className="text-white/40 truncate">{t.payload || 'NO_PAYLOAD'}</div>
                     </div>
                     <div className={`font-black ${t.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {t.status.toUpperCase()}
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>

      </div>

      <style jsx>{`
        .tactical-container {
           background: #06090f;
           background-image: 
             radial-gradient(circle at 50% 50%, rgba(2, 6, 23, 0.5) 0%, #06090f 100%),
             linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
             linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
           background-size: 100% 100%, 32px 32px, 32px 32px;
           min-height: 100vh;
           color: #fff;
        }

        .tactical-card {
           background: rgba(255, 255, 255, 0.03);
           backdrop-filter: blur(20px);
           border: 1px solid rgba(255, 255, 255, 0.08);
           border-radius: 20px;
           padding: 24px;
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tactical-card:hover {
           background: rgba(46, 111, 255, 0.05);
           border-color: rgba(46, 111, 255, 0.3);
           transform: translateY(-2px);
        }

        .animate-spin-slow {
           animation: spin 60s linear infinite;
        }

        @keyframes spin {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
        }

        .custom-scrollbar::-webkit-scrollbar {
           width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
           background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
           background: rgba(255,255,255,0.1);
           border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default TacticalDashboard;
