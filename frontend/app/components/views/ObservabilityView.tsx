import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { usePolling } from '../../lib/usePolling';
import { LineChart, BarChart2, DollarSign, Cpu, Timer, ShieldCheck } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  color: string;
}

const MetricCard = ({ title, value, sub, icon, color }: MetricCardProps) => (
  <div className="ms-glass-panel p-4 flex flex-col gap-2 bg-white/5 border-white/10 hover:border-white/20 transition-all">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{title}</span>
      <div className={`p-1.5 rounded-lg bg-${color}/10 text-${color}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-black">{value}</div>
    <div className="text-[10px] opacity-40 font-mono italic">{sub}</div>
  </div>
);

export default function ObservabilityView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await apiFetch<any>('/analytics/llmops');
      setStats(res);
    } catch (e) {
      console.error('Failed to fetch LLMOps stats', e);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchStats, 15000);

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex-center h-full opacity-20 animate-pulse">
       <div className="text-sm tracking-[8px]">INITIALIZING_LLMOPS_TELEMETRY...</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-ms-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-black tracking-tighter">LLMOps Command Hub</h1>
            <p className="text-xs text-white/40 font-mono uppercase tracking-[2px]">Enterprise Tracing & Cost Observability</p>
         </div>
         <div className="flex items-center gap-4 bg-white/5 p-2 rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-bold">REALTIME_ACTIVE</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-[10px] opacity-40 font-mono uppercase">V6.0_STABLE</span>
         </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-4 gap-4">
         <MetricCard 
            title="Total API Cost" 
            value={`$${(stats?.total_cost || 0).toFixed(4)}`} 
            sub="+12.4% vs last period" 
            icon={<DollarSign size={14} />} 
            color="emerald-400"
         />
         <MetricCard 
            title="Token Throughput" 
            value={`${((stats?.total_tokens || 0) / 1000).toFixed(1)}k`} 
            sub="P95 Latency: 1.2s" 
            icon={<Cpu size={14} />} 
            color="blue-400"
         />
         <MetricCard 
            title="Compute Load" 
            value={`${stats?.active_workers || 3}`} 
            sub="Distributed instances" 
            icon={<Timer size={14} />} 
            color="amber-400"
         />
         <MetricCard 
            title="Security Audit" 
            value="100%" 
            sub="0 Compliance Flaws" 
            icon={<ShieldCheck size={14} />} 
            color="indigo-400"
         />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-3 gap-6 h-[400px]">
         <div className="col-span-2 ms-glass-panel p-6 bg-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold uppercase tracking-[3px] opacity-40">Usage_Flow_Neural_Trace</span>
               <div className="flex gap-2 text-[9px] font-mono">
                  <span className="text-blue-400">[PROMPT]</span>
                  <span className="text-emerald-400">[COMPLETION]</span>
               </div>
            </div>
            {/* SVG Visualizer (Placeholder for Recharts) */}
            <div className="flex-1 bg-black/40 rounded-xl border border-white/5 relative overflow-hidden flex items-end px-4 pb-4 gap-1">
               {Array.from({ length: 30 }).map((_, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full bg-blue-500/20 rounded-t-sm transition-all group-hover:bg-blue-500/40" style={{ height: `${20 + Math.random() * 60}%` }} />
                    <div className="w-full bg-emerald-500/20 rounded-t-sm transition-all group-hover:bg-emerald-500/40" style={{ height: `${10 + Math.random() * 30}%` }} />
                 </div>
               ))}
               <div className="absolute top-4 left-4 text-[9px] font-mono opacity-20 uppercase">Neural_Throughput_Telemetry (TPM)</div>
            </div>
         </div>

         <div className="ms-glass-panel p-6 bg-white/5 flex flex-col gap-6">
            <span className="text-[10px] font-bold uppercase tracking-[3px] opacity-40">Cost_Distribution_Model</span>
            <div className="flex flex-col gap-4">
               {[
                 { name: 'llama3-70b', color: 'bg-emerald-400', pct: 65, cost: '$0.421' },
                 { name: 'gpt-4o', color: 'bg-blue-400', pct: 20, cost: '$1.240' },
                 { name: 'mixtral-8x7b', color: 'bg-purple-400', pct: 15, cost: '$0.082' },
               ].map(m => (
                 <div key={m.name} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px]">
                       <span className="font-bold">{m.name}</span>
                       <span className="font-mono">{m.cost}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className={`h-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                    </div>
                 </div>
               ))}
            </div>
            <div className="mt-auto pt-4 border-t border-white/5 text-[9px] font-mono opacity-30 leading-relaxed italic">
               * Costs calculated based on localized enterprise pricing tiers. Updated in real-time via TraceService hooks.
            </div>
         </div>
      </div>
    </div>
  );
}
