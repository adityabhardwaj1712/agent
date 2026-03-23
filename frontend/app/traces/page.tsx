'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson } from "../lib/api";
import { 
  Activity, 
  Clock, 
  ExternalLink, 
  Eye, 
  Zap, 
  Cpu, 
  Search,
  ChevronRight,
  Database,
  History,
  Terminal,
  Shield,
  Layers,
  Loader2
} from "lucide-react";

interface Trace {
  task_id: string;
  agent_id: string;
  count: number;
  latest: string;
}

export default function TraceExplorer() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchTraces = async () => {
    setLoading(true);
    const res = await apiJson<Trace[]>("/traces");
    if (res.ok) {
      setTraces(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTraces();
  }, []);

  const filteredTraces = traces.filter(t => 
    t.task_id.toLowerCase().includes(search.toLowerCase()) ||
    t.agent_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto animate-slide-in p-4 md:p-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-500">
            <Activity size={18} />
            <span className="text-[10px] font-black tracking-widest uppercase">Substrate Layer-0 // Telemetry_Pulse</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">Trace Explorer</h1>
          <p className="text-secondary text-sm max-w-xl mt-3 leading-relaxed">
             Investigate every atomic execution step and cognitive decision across your distributed neural architecture.
          </p>
        </div>
        
        <div className="relative group min-w-[300px]">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="FILTER_BY_NODE_OR_MISSION..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-tertiary/5 border border-white/5 rounded-2xl text-[11px] font-black text-primary placeholder:text-tertiary/20 outline-none focus:border-indigo-500/50 transition-all shadow-inner uppercase tracking-widest"
          />
        </div>
      </header>

      <section className="glass-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />
        
        {loading && traces.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <div className="relative">
               <Database size={48} className="text-indigo-500/20" />
               <Loader2 size={48} className="absolute inset-0 text-indigo-500 animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-tertiary animate-pulse">Syncing_Distributed_Substrate...</p>
          </div>
        ) : filteredTraces.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-tertiary/5 flex items-center justify-center text-tertiary/20">
               <History size={40} />
            </div>
            <div className="space-y-2">
               <h3 className="text-lg font-black text-primary uppercase tracking-tight">Zero_Signals_Detected</h3>
               <p className="text-xs text-tertiary max-w-xs mx-auto">No neural footprints match your query criteria in the active substrate.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-white/5 bg-tertiary/5">
                  <th className="px-8 py-6 text-[10px] font-black text-tertiary uppercase tracking-widest">Mission_Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-tertiary uppercase tracking-widest">Agent_Processor</th>
                  <th className="px-8 py-6 text-[10px] font-black text-tertiary uppercase tracking-widest">Complexity_Metrics</th>
                  <th className="px-8 py-6 text-[10px] font-black text-tertiary uppercase tracking-widest">Chronos_Pulse</th>
                  <th className="px-8 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTraces.map((trace) => (
                  <tr key={trace.task_id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                           <Shield size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-primary uppercase tracking-wider font-mono">{trace.task_id.substring(0, 12)}...</p>
                          <p className="text-[9px] font-black text-green-500/50 uppercase tracking-widest mt-1">VERIFIED_MISSION</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-3 text-secondary">
                        <Cpu size={14} className="text-indigo-500 opacity-50" />
                        <span className="text-[11px] font-black uppercase tracking-widest opacity-80">{trace.agent_id || "Global_Controller"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-2">
                        <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {trace.count} ATOMIC_STEPS
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-3 text-[11px] text-tertiary font-mono group-hover:text-primary transition-colors">
                        <Clock size={12} className="opacity-50" />
                        {new Date(trace.latest).toLocaleTimeString()}
                        <span className="opacity-30 ml-2">{new Date(trace.latest).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <Link 
                        href={`/traces/${trace.task_id}`}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-tertiary/10 border border-white/5 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all duration-300 group/btn"
                      >
                        <Eye size={14} className="group-hover/btn:scale-110 transition-transform" />
                        Deep_Scan
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Visual substrate indicators */}
      <footer className="flex flex-wrap gap-8 py-12 border-t border-white/5">
         <div className="flex items-center gap-4 text-tertiary">
            <Layers size={16} className="text-indigo-500" />
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase tracking-widest">Substrate_Identity</p>
               <p className="text-[11px] font-medium opacity-60 uppercase">Node-Primary-Alpha</p>
            </div>
         </div>
         <div className="flex items-center gap-4 text-tertiary">
            <Terminal size={16} className="text-indigo-500" />
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase tracking-widest">Observability_Stream</p>
               <p className="text-[11px] font-medium opacity-60 uppercase">Streaming_Enabled</p>
            </div>
         </div>
         <div className="ml-auto">
            <div className="px-6 py-2 bg-indigo-500/5 border border-indigo-500/20 rounded-full flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Mesh_Live</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
