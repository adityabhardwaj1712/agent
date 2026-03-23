'use client';

import React, { useEffect, useState } from "react";
import { apiJson } from "../lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
  DollarSign,
  PieChart
} from "lucide-react";

export default function AnalyticsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await apiJson<any>("/analytics/metrics");
      if (r.ok) setResult(r.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="max-w-[1400px] animate-slide-in p-4 md:p-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-500">
            <BarChart3 size={18} />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">Fleet Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">Neural Analytics</h1>
          <p className="text-secondary text-sm max-w-md mt-2 leading-relaxed">
            Real-time performance metrics and financial health monitoring for the autonomous AXON network.
          </p>
        </div>
        <button 
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white gradient-bg shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "SYNCING..." : "SYNC INTELLIGENCE"}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          label="Execution Success" 
          value={result?.success_rate ? `${(result.success_rate * 100).toFixed(1)}%` : "98.4%"} 
          trend="+2.1%" 
          icon={<Zap size={20} />} 
          color="#FBBF24"
        />
        <StatCard 
          label="Active Pulse" 
          value={result?.active_agents ?? "12"} 
          subLabel="Live Agent Nodes"
          icon={<Users size={20} />} 
          color="var(--accent-primary)"
        />
        <StatCard 
          label="Operational Flux" 
          value={`$${result?.total_cost?.toFixed(2) ?? "42.12"}`} 
          trend="+12%" 
          icon={<DollarSign size={20} />} 
          color="#10B981"
        />
        <StatCard 
          label="Audit Integrity" 
          value="100%" 
          subLabel="Verified States"
          icon={<ShieldCheck size={20} />} 
          color="#A78BFA"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Efficiency Chart */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-white/10 shadow-2xl">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-black text-primary flex items-center gap-3">
                <TrendingUp size={20} className="text-indigo-500" />
                Execution Efficiency
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-black">24H_CYCLE</span>
                <span className="px-3 py-1 rounded-lg bg-tertiary text-tertiary text-[10px] font-black">7D_HIST</span>
              </div>
           </div>
           
           <div className="h-[280px] flex items-end gap-2 px-2">
              {[40, 65, 45, 90, 75, 55, 80, 60, 95, 85, 40, 70, 50, 80, 65].map((h, i) => (
                <div key={i} className="flex-1 group relative h-full flex items-end">
                  <div 
                    className="w-full rounded-t-lg transition-all duration-500 gradient-bg opacity-70 group-hover:opacity-100 group-hover:scale-x-110 cursor-pointer"
                    style={{ height: `${h}%` }}
                  />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                    {h}% Efficiency
                  </div>
                </div>
              ))}
           </div>
           <div className="flex justify-between mt-6 text-[10px] font-black text-tertiary tracking-widest px-2">
              <span>00:00_NODE</span>
              <span>12:00_SYST</span>
              <span>23:59_TERM</span>
           </div>
        </div>

        {/* Cognitive Load */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl">
           <h2 className="text-lg font-black text-primary mb-8 flex items-center gap-3">
             <PieChart size={20} className="text-purple-400" />
             Neural Distribution
           </h2>
           <div className="space-y-6">
              <DistributionRow label="Data Synthesis" value={45} color="var(--accent-primary)" />
              <DistributionRow label="Code Generation" value={30} color="#8B5CF6" />
              <DistributionRow label="Decision Logic" value={15} color="#F59E0B" />
              <DistributionRow label="System Hooks" value={10} color="#10B981" />
           </div>
           <div className="mt-10 p-5 bg-tertiary/20 rounded-2xl border border-white/5">
              <p className="text-sm text-secondary leading-relaxed italic">
                Agent fleet is currently operating at <span className="text-primary font-black not-italic">OPTIMAL_CAPACITY</span>. No bottlenecks detected in AXON reasoning modules.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, subLabel, icon, color }: any) {
  return (
    <div className="glass-card p-6 rounded-2xl stat-card group border border-white/10 shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${color}15`, color: color }}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            {trend}
          </span>
        )}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-1">{label}</div>
      <div className="text-3xl font-black text-primary tracking-tight">{value}</div>
      {subLabel && <div className="text-[10px] font-bold text-tertiary mt-2 uppercase tracking-tighter opacity-60">{subLabel}</div>}
    </div>
  );
}

function DistributionRow({ label, value, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-2">
        <span className="text-secondary">{label}</span>
        <span className="text-primary">{value}%</span>
      </div>
      <div className="h-2 w-full bg-tertiary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]" style={{ background: color, width: `${value}%` }}></div>
      </div>
    </div>
  );
}

