'use client';

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Cpu, 
  Search, 
  Filter, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { apiFetch } from "../lib/api";

// -----------------------------------------------------
// 1. KPI Sparkline Card
// -----------------------------------------------------
export function MetricCard({ title, value, subtext, trend, color, data }: { 
  title: string, value: string | number, subtext: string, trend: 'up'|'down'|'neutral', color: string, data: number[] 
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  
  // Simple SVG path generation for sparkline
  const width = 100;
  const height = 30;
  const pathData = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / (range || 1)) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="ms-glass-panel flex flex-col justify-between p-4 h-full relative overflow-hidden group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-[var(--t2)] tracking-wide">{title}</span>
        <div className="ms-icon-box" style={{ width: 24, height: 24, background: `rgba(255,255,255,0.03)`, color: 'var(--t3)' }}>
           <Activity size={12} />
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-auto">
         <div>
            <div className="text-[28px] font-black leading-none mb-1 text-white tracking-tight">{value}</div>
            <div className="text-[10px] font-bold flex items-center gap-1" style={{ color: trend === 'down' ? 'var(--red)' : color }}>
               {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {subtext}
            </div>
         </div>
         
         <div style={{ width: '80px', height: '30px' }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
               <defs>
                  <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                     <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                  </linearGradient>
               </defs>
               {data.length > 1 && (
                 <>
                   <path d={`${pathData} L ${width} ${height} L 0 ${height} Z`} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
                   <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
                         style={{ filter: `drop-shadow(0 2px 4px ${color}88)` }} />
                 </>
               )}
            </svg>
         </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------
// 2. Incident Feed
// -----------------------------------------------------
export function IncidentFeed() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await apiFetch<any[]>('/traces');
        if (data && data.length > 0) {
          // Look for failing steps (those containing 'error', 'failed', 'timeout', etc.)
          const errorKeywords = ['error', 'failed', 'timeout', 'exception', 'refused'];
          const failed = data.filter(t => 
            (t.status && errorKeywords.includes(t.status.toLowerCase())) || 
            (t.step && errorKeywords.some(k => t.step.toLowerCase().includes(k)))
          ).slice(0, 2);

          if (failed.length === 0) {
             setIncidents([
               { id: 1, type: 'warning', msg: 'Warning: Resource Limit', sub: 'Neural Mesh utilization is peaking at 98%', time: '2m ago' },
               { id: 2, type: 'error', msg: 'Protocol Sync Error', sub: 'Connection refused on vector-sync-03', time: '15m ago' }
             ]);
          } else {
             setIncidents(failed.map(f => ({
               type: 'error',
               msg: `Trace Logic Error: ${f.step || 'Execution Fault'}`,
               sub: `Trace ID: ${f.trace_id.substring(0, 8)} | Agent: ${f.agent_id.substring(0, 8)}`,
               time: 'Just now'
             })));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <div className="flex flex-col gap-3">
       <div className="flex justify-between items-center mb-1">
          <span className="text-[12px] font-bold text-white tracking-wide">Incident Feed</span>
       </div>
       {incidents.map((inc, i) => (
         <div key={i} className="flex p-3 rounded-lg border items-start gap-3" 
              style={{ 
                background: inc.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                borderColor: inc.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              }}>
            <AlertTriangle size={14} className={inc.type === 'error' ? 'text-red-500' : 'text-amber-500'} style={{ marginTop: 2, flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
               <div className="text-[11px] font-bold text-white truncate mb-0.5">{inc.msg || 'System Alert'}</div>
               <div className="text-[10px] text-[var(--t3)] leading-tight truncate">{inc.sub || inc.step || 'Execution fault detected in routine.'}</div>
            </div>
         </div>
       ))}
    </div>
  );
}

// -----------------------------------------------------
// 3. Dashboard Agent List
// -----------------------------------------------------
export function DashboardAgentList() {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await apiFetch<any[]>('/agents');
        setAgents(data || []);
      } catch(e) {}
    };
    fetchAgents();
  }, []);

  return (
    <div className="ms-glass-panel flex flex-col h-full overflow-hidden">
       <div className="p-4 pb-0">
          <div className="flex justify-between items-center mb-4">
             <span className="text-[12px] font-bold text-white tracking-wide">Agents</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
             <div className="relative flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]" />
                <input className="fi" style={{ paddingLeft: '32px', height: '32px', fontSize: '11px', background: 'var(--bg1)', border: '1px solid var(--bg3)' }} placeholder="Search..." />
             </div>
             <button className="ms-btn-icon-sm" style={{ width: 32, height: 32, background: 'var(--bg1)', border: '1px solid var(--bg3)' }}><Filter size={12}/></button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto px-4 pb-4">
          <table className="w-full text-left border-collapse">
            <thead>
               <tr>
                  <th className="pb-3 text-[10px] font-bold text-[var(--t3)] w-8">
                     <div className="w-3 h-3 border border-[var(--t3)] rounded-[3px] opacity-50"></div>
                  </th>
                  <th className="pb-3 text-[10px] font-bold text-[var(--t3)] w-auto">Name ↓</th>
                  <th className="pb-3 text-[10px] font-bold text-[var(--t3)] w-16 text-right">Status</th>
               </tr>
            </thead>
            <tbody>
               {agents.slice(0, 10).map((a, i) => (
                  <tr key={i} className="group border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                     <td className="py-2.5">
                        <div className="w-3 h-3 border border-[var(--t3)] rounded-[3px] opacity-30 group-hover:opacity-100 group-hover:border-white transition-opacity"></div>
                     </td>
                     <td className="py-2.5">
                        <div className="flex items-center gap-2">
                           <div className="ms-avatar" style={{ width: 22, height: 22, fontSize: '9px', background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', border: 'none' }}>
                              <Cpu size={10} />
                           </div>
                           <span className="text-[11px] font-bold text-[var(--t2)] group-hover:text-white transition-colors">{a.name}</span>
                        </div>
                     </td>
                     <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                           <span className="text-[10px] font-bold text-green-500">Status</span>
                        </div>
                     </td>
                  </tr>
               ))}
               {agents.length === 0 && (
                 <tr>
                    <td colSpan={3} className="py-8 text-center text-[11px] text-[var(--t3)]">No agents detected.</td>
                 </tr>
               )}
            </tbody>
          </table>
       </div>
    </div>
  );
}

// -----------------------------------------------------
// 4. Configraph / Execute Box
// -----------------------------------------------------
export function ConfigraphWidget() {
   const nodes = [
      { id: 1, name: 'Data Scraper', color: 'var(--cyan)' },
      { id: 2, name: 'ML Inference', color: 'var(--green)' },
      { id: 3, name: 'Database Write', color: 'var(--violet)' }
   ];

   return (
      <div className="flex flex-col gap-3">
         <div className="flex justify-between items-center mb-1">
            <span className="text-[12px] font-bold text-white tracking-wide">Select Agents and configraph</span>
         </div>
         <div className="ms-glass-panel p-3">
            <div className="space-y-2 mb-4">
               {nodes.map(n => (
                  <div key={n.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] cursor-pointer transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="ms-icon-box" style={{ width: 24, height: 24, background: `color-mix(in srgb, ${n.color} 15%, transparent)`, color: n.color }}>
                           <Cpu size={12} />
                        </div>
                        <div>
                           <div className="text-[11px] font-bold text-[var(--t2)]">{n.name}</div>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              <span className="text-[9px] font-bold text-[var(--t3)]">Status</span>
                           </div>
                        </div>
                     </div>
                     <div className="text-[var(--t3)]">›</div>
                  </div>
               ))}
            </div>
            
            <div className="flex gap-2">
               <button className="ms-btn ms-btn-sm flex-1" style={{ background: 'var(--bg2)', borderColor: 'var(--bg3)', fontSize: '11px', fontWeight: 800 }}>Add Node</button>
               <button className="ms-btn ms-btn-p ms-btn-sm flex-1" style={{ fontSize: '11px', fontWeight: 800 }}>Execute Workflow</button>
            </div>
         </div>
      </div>
   );
}
