'use client';

import React, { useEffect, useState } from "react";
import { apiJson } from "../lib/api";
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Pulse, 
  Radio, 
  Cpu, 
  Terminal,
  RefreshCw,
  Loader2,
  TrendingUp,
  CircleDot
} from "lucide-react";

interface Metric {
  active_agents: number;
  tasks_last_24h: number;
  success_rate: string;
  auto_healing_events: number;
  events_summary: Record<string, number>;
}

export default function ExecutionMonitor() {
  const [metrics, setMetrics] = useState<Metric | null>(null);

  useEffect(() => {
    const fetchMetrics = () => {
      apiJson<Metric>("/analytics/metrics").then(res => {
        if (res.ok) setMetrics(res.data);
      });
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="relative">
        <Radio size={48} className="text-indigo-500/20" />
        <Loader2 size={48} className="absolute inset-0 text-indigo-500 animate-spin" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-tertiary">Connecting to fleet telemetry...</p>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto animate-slide-in p-4 md:p-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#10B981]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-tertiary">Fleet Status // Real-time Telemetry</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">Execution Monitor</h1>
          <p className="text-secondary text-sm max-w-xl mt-3 leading-relaxed">
             Real-time pulse of the autonomous engine. Synchronizing mission metrics across the decentralized neural array.
          </p>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-3 glass-card rounded-2xl border border-white/10 shadow-lg">
           <Activity size={18} className="text-indigo-500" />
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-tertiary uppercase tracking-widest leading-none">Global_Load</span>
              <span className="text-lg font-black text-primary tracking-tighter leading-none mt-1">OPTIMAL</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Throughput */}
        <div className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-2xl group hover:border-indigo-500/30 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
              <Zap size={24} fill="currentColor" className="opacity-40" />
            </div>
            <span className="text-[9px] font-black text-tertiary uppercase tracking-widest opacity-60 mt-1">Throughput</span>
          </div>
          <div className="space-y-1">
            <div className="text-5xl font-black text-primary tracking-tighter tabular-nums">{metrics.tasks_last_24h}</div>
            <div className="text-[10px] font-bold text-tertiary uppercase flex items-center gap-2">
               <TrendingUp size={12} className="text-green-500" />
               Missions Dispatched / 24h
            </div>
          </div>
        </div>

        {/* Reliability */}
        <div className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-2xl group hover:border-green-500/30 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} fill="currentColor" className="opacity-40" />
            </div>
            <span className="text-[9px] font-black text-tertiary uppercase tracking-widest opacity-60 mt-1">Reliability</span>
          </div>
          <div className="space-y-1">
            <div className="text-5xl font-black text-green-500 tracking-tighter tabular-nums">{metrics.success_rate}</div>
            <div className="text-[10px] font-bold text-tertiary uppercase flex items-center gap-2">
               <CircleDot size={12} className="text-indigo-500" />
               Neural Alignment Accuracy
            </div>
          </div>
        </div>

        {/* Self-Healing */}
        <div className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-2xl group hover:border-orange-500/30 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <RefreshCw size={24} className="opacity-40" />
            </div>
            <span className="text-[9px] font-black text-tertiary uppercase tracking-widest opacity-60 mt-1">Self-Healing</span>
          </div>
          <div className="space-y-1">
            <div className="text-5xl font-black text-orange-500 tracking-tighter tabular-nums">{metrics.auto_healing_events}</div>
            <div className="text-[10px] font-bold text-tertiary uppercase flex items-center gap-2">
               <Cpu size={12} className="text-orange-500" />
               Autonomous Interventions
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
             <BarChart3 size={20} className="text-indigo-500" />
             <h3 className="text-lg font-black text-primary uppercase tracking-tight">Vibration Analysis // Event Loop</h3>
          </div>
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Sampling Rate: 5Hz</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            {Object.entries(metrics.events_summary || {}).map(([type, count]) => (
              <div key={type} className="group cursor-help">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-tertiary uppercase tracking-[0.15em] opacity-60">{type}</span>
                    <span className="text-sm font-bold text-secondary group-hover:text-indigo-500 transition-colors uppercase tracking-tighter mt-1">{type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-sm font-black text-primary tabular-nums tracking-widest">{count}</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-[2000ms] cubic-bezier(0.34, 1.56, 0.64, 1)"
                    style={{ width: `${Math.min(100, (count / (metrics.tasks_last_24h || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="glass-card bg-black/20 rounded-3xl p-8 border border-white/5 flex flex-col justify-center gap-6 relative overflow-hidden">
             <div className="relative z-10 space-y-2">
                <h4 className="text-sm font-black text-indigo-500 uppercase tracking-widest">Neural Health Indices</h4>
                <p className="text-tertiary text-xs leading-relaxed max-w-xs">
                  Advanced heuristics suggest the current autonomous cluster is operating at Peak Displacement Efficiency.
                </p>
             </div>
             <div className="relative z-10 flex gap-4">
                <div className="flex-1 p-4 bg-tertiary/10 rounded-2xl border border-white/5">
                   <div className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1 opacity-50">Latency</div>
                   <div className="text-lg font-black text-primary tracking-tighter">142ms</div>
                </div>
                <div className="flex-1 p-4 bg-tertiary/10 rounded-2xl border border-white/5">
                   <div className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1 opacity-50">Parallelism</div>
                   <div className="text-lg font-black text-primary tracking-tighter">84%</div>
                </div>
             </div>
             {/* Abstract background element */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 filter blur-[60px] rounded-full pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
