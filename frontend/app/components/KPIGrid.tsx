"use client";
import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle2, Zap, RefreshCw, TrendingUp, Activity, Target } from 'lucide-react';
import { apiJson } from '../lib/api';

interface KPIItem {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ElementType;
  trend: number[];
  color: string;
  shadow: string;
}

export default function KPIGrid() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      const r = await apiJson<any>("/analytics/metrics");
      if (r.ok) {
        setMetrics(r.data);
      }
      setLoading(false);
    }
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const KPI_DATA: KPIItem[] = [
    { 
      label: 'Active_Entities', 
      sublabel: 'Neural_Nodes_Online',
      value: loading ? '...' : (metrics?.active_agents || '12'), 
      icon: Users, 
      trend: [20, 35, 25, 45, 30, 50, 42], 
      color: '#6366F1',
      shadow: 'rgba(99,102,241,0.2)'
    },
    { 
      label: 'Success_Index', 
      sublabel: 'Mission_Certainty',
      value: loading ? '...' : (metrics?.success_rate || '98.4%'), 
      icon: CheckCircle2, 
      trend: [80, 85, 82, 88, 86, 92, 95], 
      color: '#10B981',
      shadow: 'rgba(16,185,129,0.2)'
    },
    { 
      label: 'HITL_Intercepts', 
      sublabel: 'Manual_Overides',
      value: loading ? '...' : (metrics?.hitl_interceptions || '3'), 
      icon: Target, 
      trend: [2, 5, 3, 8, 4, 10, 6], 
      color: '#F59E0B',
      shadow: 'rgba(245,158,11,0.2)'
    },
    { 
      label: 'Auto_Healing', 
      sublabel: 'Self_Repair_Cycles',
      value: loading ? '...' : (metrics?.auto_healing_events || '24'), 
      icon: Activity, 
      trend: [10, 15, 12, 20, 18, 25, 22], 
      color: '#8B5CF6',
      shadow: 'rgba(139,92,246,0.2)'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      {KPI_DATA.map((kpi, idx) => (
        <div key={kpi.label} 
          className="glass-card rounded-[2.5rem] p-8 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden animate-slide-in"
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          {/* Background Gradient Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 -mr-16 -mt-16 transition-all group-hover:opacity-40" style={{ background: kpi.color }} />
          
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:rotate-12 group-hover:shadow-2xl" 
                 style={{ 
                   background: `${kpi.color}10`, 
                   borderColor: `${kpi.color}20`,
                   color: kpi.color,
                   boxShadow: `0 10px 30px ${kpi.shadow}`
                 }}>
              <kpi.icon size={28} />
            </div>
            <div className="flex flex-col items-end">
               <div className="px-3 py-1 rounded-full text-[9px] font-black bg-white/5 border border-white/10 text-primary flex items-center gap-2 mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                 LIVE_SYNC
               </div>
               <TrendingUp size={14} className="text-green-500 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-[10px] font-bold mb-1 uppercase tracking-[0.2em] text-tertiary opacity-60 group-hover:opacity-100 transition-opacity mono">{kpi.label}</h3>
            <div className="flex items-baseline gap-2">
               <p className="text-4xl font-bold text-primary tracking-tighter mono">{kpi.value}</p>
               <span className="text-[10px] font-semibold text-accent-secondary opacity-60 uppercase tracking-widest mono">{kpi.sublabel}</span>
            </div>
          </div>
          
          <div className="mt-8 h-12 relative z-10 opacity-30 group-hover:opacity-100 transition-all duration-700">
            <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
              <path 
                d={`M 0 ${40 - kpi.trend[0]} ${kpi.trend.map((v, i) => `L ${i * (100 / (kpi.trend.length - 1))} ${40 - (v > 40 ? 40 : v)}`).join(' ')}`}
                fill="none"
                stroke={kpi.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-1000"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
