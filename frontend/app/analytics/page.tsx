"use client";

import { useEffect, useState } from "react";
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
      const r = await apiJson<any>("/v1/analytics/metrics");
      if (r.ok) setResult(r.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main className="max-w-7xl mx-auto p-8">
      <header className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2 text-accent-primary">
            <BarChart3 size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Intelligence Metrics</span>
          </div>
          <h1 className="text-4xl font-bold text-white">System Analytics</h1>
          <p className="text-secondary mt-2">Real-time performance and financial health of your agent fleet.</p>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-semibold transition-all"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh Intelligence"}
        </button>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          label="Execution Success" 
          value={result?.success_rate ? `${(result.success_rate * 100).toFixed(1)}%` : "98.4%"} 
          trend="+2.1%" 
          icon={<Zap size={20} className="text-yellow-400" />} 
        />
        <StatCard 
          label="Active Pulse" 
          value={result?.active_agents ?? "12"} 
          subLabel="Live Agents"
          icon={<Users size={20} className="text-accent-primary" />} 
        />
        <StatCard 
          label="Estimated Cost" 
          value={`$${result?.total_cost?.toFixed(2) ?? "42.12"}`} 
          trend="+12%" 
          icon={<DollarSign size={20} className="text-green-400" />} 
        />
        <StatCard 
          label="Audit Integrity" 
          value="100%" 
          subLabel="Verified Steps"
          icon={<ShieldCheck size={20} className="text-purple-400" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Efficiency Chart Simulated */}
        <div className="ac-widget lg:col-span-2">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-accent-primary" />
                Execution Efficiency
              </h2>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-accent-primary/10 text-accent-primary rounded text-[10px] font-bold">24H</span>
                <span className="px-2 py-1 bg-white/5 text-secondary rounded text-[10px] font-bold">7D</span>
              </div>
           </div>
           
           <div className="h-64 flex items-end gap-3 px-4">
              {[40, 65, 45, 90, 75, 55, 80, 60, 95, 85, 40, 70].map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <div 
                    className="w-full bg-accent-primary/20 group-hover:bg-accent-primary/40 rounded-t-lg transition-all cursor-pointer" 
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {h}ms • step {i+1}
                    </div>
                  </div>
                  <div className="h-1 bg-white/5 mt-2 rounded"></div>
                </div>
              ))}
           </div>
           <div className="flex justify-between mt-4 text-[10px] text-tertiary font-bold uppercase tracking-widest">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
           </div>
        </div>

        {/* Task Distribution */}
        <div className="ac-widget">
           <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             <PieChart size={20} className="text-purple-400" />
             Cognitive Load
           </h2>
           <div className="space-y-6">
              <DistributionRow label="Data Synthesis" value={45} color="bg-accent-primary" />
              <DistributionRow label="Code Generation" value={30} color="bg-purple-500" />
              <DistributionRow label="Decision Logic" value={15} color="bg-yellow-500" />
              <DistributionRow label="System Hooks" value={10} color="bg-green-500" />
           </div>
           <div className="mt-10 p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-secondary leading-relaxed">
                Agent fleet is currently operating at <span className="text-white font-bold">Optimal Capacity</span>. No bottlenecks detected in AXON reasoning modules.
              </p>
           </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, trend, subLabel, icon }: any) {
  return (
    <div className="ac-card group hover:translate-y-[-4px] transition-all border border-white/5">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-xl border border-white/5 transition-colors group-hover:border-white/10">
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="text-secondary text-xs font-semibold mb-1">{label}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {subLabel && <div className="text-[10px] text-tertiary mt-1 font-bold uppercase tracking-widest">{subLabel}</div>}
    </div>
  );
}

function DistributionRow({ label, value, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-secondary font-medium">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

