'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, TrendingUp, Info, PieChart, Activity, DollarSign, Zap, BarChart3, ChevronRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface CostData {
  cost_total: number;
  cost_daily_burn: number;
  cost_by_model: Record<string, number>;
  cost_by_agent: Record<string, number>;
}

export default function CostTicker() {
  const [data, setData] = useState<CostData | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiFetch('/analytics/metrics');
        setData(result);
      } catch (err) {
        console.error("Failed to fetch cost data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return (
    <div className="flex items-center gap-2 px-4 py-2 bg-tertiary/5 border border-white/5 rounded-full opacity-60">
      <Loader2 size={12} className="animate-spin text-indigo-500" />
      <span className="text-[9px] font-black uppercase tracking-widest text-tertiary">Syncing_Burn_Rate...</span>
    </div>
  );

  return (
    <div className="relative group" onMouseEnter={() => setShowPopup(true)} onMouseLeave={() => setShowPopup(false)}>
      <div className="flex items-center gap-3 px-5 py-2.5 bg-black/40 border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all cursor-crosshair">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           <span className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">BURN:</span>
           <span className="text-[13px] font-black text-primary tracking-tight">${data.cost_daily_burn.toFixed(2)}</span>
        </div>
        
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">TOTAL:</span>
           <span className="text-[13px] font-black text-primary tracking-tight">${data.cost_total.toFixed(2)}</span>
        </div>
        
        <ArrowUpRight size={14} className="text-green-500 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>

      {showPopup && (
        <div className="absolute top-full right-0 mt-4 w-72 glass-card rounded-[2rem] border border-white/10 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] z-[500] animate-slide-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                <BarChart3 size={18} />
              </div>
              <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Matrix_Economics</h4>
            </div>
            <span className="text-[9px] font-black text-indigo-500 uppercase">Live</span>
          </div>

          <div className="space-y-8">
             <div className="space-y-4">
               <label className="text-[9px] font-black text-tertiary uppercase tracking-widest opacity-40">Model_Allocation</label>
               <div className="space-y-3">
                 {Object.entries(data.cost_by_model).map(([model, cost]) => (
                   <div key={model} className="flex items-center justify-between group/item">
                      <span className="text-[11px] font-black text-secondary uppercase tracking-tight group-hover/item:text-primary transition-colors">{model}</span>
                      <span className="text-[11px] font-mono text-tertiary group-hover/item:text-indigo-400 transition-colors">${cost.toFixed(3)}</span>
                   </div>
                 ))}
               </div>
             </div>

             <div className="space-y-4 pt-6 border-t border-white/5">
                <label className="text-[9px] font-black text-tertiary uppercase tracking-widest opacity-40">Agent_Heavy_Lifters</label>
                <div className="space-y-3">
                  {Object.entries(data.cost_by_agent).slice(0, 3).map(([agent, cost]) => (
                    <div key={agent} className="flex items-center justify-between group/item">
                       <span className="text-[11px] font-black text-secondary uppercase tracking-tight truncate max-w-[140px] group-hover/item:text-primary transition-colors">{agent}</span>
                       <span className="text-[11px] font-mono text-tertiary group-hover/item:text-indigo-400 transition-colors">${cost.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="mt-8 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center justify-between">
             <span className="text-[9px] font-black text-tertiary uppercase tracking-widest">Rate/HR</span>
             <span className="text-[11px] font-black text-indigo-500 tracking-tight">${(data.cost_daily_burn / 24).toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
