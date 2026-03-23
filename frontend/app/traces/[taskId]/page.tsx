'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiJson } from "../../lib/api";
import { 
  ArrowLeft, 
  Search, 
  Brain, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Terminal,
  Layers,
  ShieldCheck,
  Cpu,
  Fingerprint,
  Box,
  Eye,
  Settings,
  Database,
  Loader2
} from "lucide-react";

interface TraceStep {
  trace_id: string;
  step: string;
  input_data: any;
  output_data: any;
  created_at: string;
}

export default function TraceDetail() {
  const { taskId } = useParams();
  const router = useRouter();
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTraces() {
      setLoading(true);
      const res = await apiJson<TraceStep[]>(`/traces/${taskId}`);
      if (res.ok) {
        setSteps(res.data);
      }
      setLoading(false);
    }
    if (taskId) fetchTraces();
  }, [taskId]);

  const getStepIcon = (step: string) => {
    const s = step.toLowerCase();
    if (s.includes("memory")) return <Layers size={16} className="text-blue-400" />;
    if (s.includes("reasoning") || s.includes("thinking")) return <Brain size={16} className="text-purple-400" />;
    if (s.includes("tool_execution")) return <Zap size={16} className="text-amber-400" />;
    if (s.includes("complete") || s.includes("success")) return <CheckCircle2 size={16} className="text-green-400" />;
    if (s.includes("security") || s.includes("auth")) return <ShieldCheck size={16} className="text-red-400" />;
    return <Cpu size={16} className="text-secondary" />;
  };

  return (
    <div className="max-w-[1000px] mx-auto animate-slide-in p-4 md:p-8 space-y-10">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-3 px-6 py-3 bg-tertiary/5 border border-white/5 rounded-2xl text-[10px] font-black text-tertiary uppercase tracking-[0.2em] hover:bg-tertiary/10 hover:text-primary transition-all duration-300 group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Return_to_Telemetry_Stream
      </button>

      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-full text-[9px] font-black uppercase tracking-widest">
            Deep_Trace_Analysis
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-tertiary uppercase tracking-widest opacity-60">
            <Clock size={12} className="text-indigo-500" />
            Origin_Cycle: {steps.length > 0 ? new Date(steps[0].created_at).toLocaleString() : "Syncing..."}
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-primary tracking-tighter">
            Mission <span className="text-indigo-500 font-mono tracking-normal">#{String(taskId).substring(0, 12)}</span>
          </h1>
          <p className="text-secondary text-sm max-w-xl leading-relaxed">
             Visualizing the high-fidelity cognitive path and tool interactions of the neural agent during this mission cycle.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
           <div className="relative">
              <Activity size={48} className="text-indigo-500/20" />
              <Loader2 size={48} className="absolute inset-0 text-indigo-500 animate-spin" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-tertiary animate-pulse">Decompiling_Mission_Traces...</p>
        </div>
      ) : steps.length === 0 ? (
        <div className="glass-card p-20 rounded-[2.5rem] border border-white/10 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-tertiary/5 flex items-center justify-center text-tertiary/20 mx-auto">
             <Search size={40} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-tertiary font-mono">Zero_Cognitive_Footprints_Detected</p>
        </div>
      ) : (
        <div className="relative pl-10 space-y-8">
          {/* Vertical Timeline Rail */}
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500 via-indigo-500/20 to-transparent" />

          {steps.map((step, index) => (
            <div key={step.trace_id} className="relative group animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
              {/* Timeline Node */}
              <div className="absolute -left-[32px] top-4 w-12 h-12 bg-black border border-white/10 rounded-2xl flex items-center justify-center z-10 shadow-2xl group-hover:border-indigo-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/20 transition-all" />
                {getStepIcon(step.step)}
              </div>

              <div className={`glass-card rounded-3xl border transition-all duration-500 overflow-hidden shadow-xl ${expandedStep === step.trace_id ? 'border-indigo-500/30 ring-1 ring-indigo-500/20' : 'border-white/10 hover:border-white/20'}`}>
                <button 
                  onClick={() => setExpandedStep(expandedStep === step.trace_id ? null : step.trace_id)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left group/btn"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-[10px] font-black text-tertiary opacity-30 font-mono tracking-tighter">
                       [{String(index + 1).padStart(2, '0')}]
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                        {step.step.replace(/_/g, " ")}
                      </h3>
                      <p className="text-[9px] font-black text-indigo-500/50 uppercase tracking-widest mt-1">
                        T+{new Date(step.created_at).toLocaleTimeString()} // ID: {step.trace_id.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className={`text-tertiary transition-transform duration-500 ${expandedStep === step.trace_id ? 'rotate-180' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                <div className={`transition-all duration-700 ease-in-out overflow-hidden ${expandedStep === step.trace_id ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-8 pb-10 space-y-10">
                    <div className="h-px bg-gradient-to-r from-white/5 to-transparent" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {step.input_data && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <Fingerprint size={16} className="text-indigo-500" />
                             <span className="text-[9px] font-black text-primary uppercase tracking-widest">Input_Manifest</span>
                          </div>
                          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl font-mono text-[11px] text-secondary leading-relaxed overflow-auto max-h-[400px] relative group/code scrollbar-hide">
                            {typeof step.input_data === 'string' ? step.input_data : JSON.stringify(step.input_data, null, 2)}
                          </div>
                        </div>
                      )}

                      {step.output_data && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <Box size={16} className="text-green-500" />
                             <span className="text-[9px] font-black text-primary uppercase tracking-widest">Output_State</span>
                          </div>
                          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl font-mono text-[11px] text-green-500/80 leading-relaxed overflow-auto max-h-[400px] relative group/code scrollbar-hide">
                             {typeof step.output_data === 'string' ? step.output_data : JSON.stringify(step.output_data, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-[9px] font-black text-tertiary opacity-40 uppercase tracking-widest">
                       <div className="flex items-center gap-2">
                          <Terminal size={12} />
                          TX_NODE_ALPHA // {step.trace_id}
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                             <ShieldCheck size={12} />
                             Cryptographicly_Sealed
                          </div>
                          <div className="flex items-center gap-2">
                             <Settings size={12} />
                             Audit_Log_Reference_412
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visual background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5 z-[-1]">
         <div className="absolute top-[30%] left-[10%] w-[30rem] h-[30rem] bg-indigo-500 rounded-full filter blur-[150px]" />
         <div className="absolute top-[60%] right-[10%] w-[20rem] h-[20rem] bg-indigo-500 rounded-full filter blur-[120px]" />
      </div>

    </div>
  );
}
  );
}
