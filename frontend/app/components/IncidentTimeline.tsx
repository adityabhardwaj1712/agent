'use client';

import React from 'react';
import { AlertTriangle, Info, ShieldAlert, Radio, Clock, ChevronRight, Activity, Terminal } from 'lucide-react';

const INCIDENTS = [
  { time: '14:32', agent: 'Agent cost spiked 5x', status: 'NORMAL_BURN', type: 'warning', description: 'Anomaly detected in compute allocation' },
  { time: '14:33', agent: 'Circuit breaker triggered', status: 'CRITICAL_STOP', type: 'critical', description: 'Emergency protocol initiated by kernel' },
  { time: '14:45', agent: 'Neural sync completed', status: 'SYNCED', type: 'info', description: 'All base protocols updated successfully' },
  { time: '15:10', agent: 'Encryption cycle rotated', status: 'SECURE', type: 'info', description: 'System security keys successfully refreshed' },
];

export default function IncidentTimeline() {
  return (
    <div className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-slide-in h-full flex flex-col">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
             <Radio size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">System_Hot_Log</h3>
            <p className="text-[9px] font-black text-tertiary uppercase tracking-widest mt-1 opacity-40">Axon_Protocol_v4.2</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-xl">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live_Sync</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-10 relative custom-scrollbar">
        {/* Vertical Guide Line */}
        <div className="absolute left-[51px] top-10 bottom-10 w-[1px] bg-gradient-to-b from-indigo-500/50 via-white/10 to-transparent" />

        {INCIDENTS.map((item, i) => (
          <div key={i} className="relative flex items-start gap-8 group animate-slide-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg ${
              item.type === 'critical' ? 'bg-red-500/20 text-red-500 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white' :
              item.type === 'warning' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white' :
              'bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white'
            }`}>
               {item.type === 'critical' ? <ShieldAlert size={18} /> : 
                item.type === 'warning' ? <AlertTriangle size={18} /> : 
                <Info size={18} />}
            </div>

            <div className="flex-1 space-y-2 pt-1 transition-all group-hover:translate-x-1">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">
                     {item.time}_TIME_PROTOCOL
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${
                    item.type === 'critical' ? 'text-red-500' :
                    item.type === 'warning' ? 'text-amber-500' :
                    'text-indigo-500'
                  }`}>
                    {item.status}
                  </span>
               </div>
               <div className="flex items-center justify-between gap-4">
                 <p className="text-[14px] font-black text-primary tracking-tight leading-tight uppercase group-hover:text-indigo-400 transition-colors">
                   {item.agent}
                 </p>
                 <ChevronRight size={14} className="text-tertiary opacity-0 group-hover:opacity-40 transition-all" />
               </div>
               <p className="text-[11px] font-medium text-tertiary uppercase tracking-tight opacity-60">
                 {item.description}
               </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-between px-8">
         <div className="flex items-center gap-4 text-tertiary opacity-30">
            <Activity size={12} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Matrix_Analysis</span>
         </div>
         <button className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] hover:text-indigo-400 transition-colors flex items-center gap-2 group">
           Full_Diagnostic
           <Terminal size={12} className="group-hover:translate-x-1 transition-transform" />
         </button>
      </div>
    </div>
  );
}
