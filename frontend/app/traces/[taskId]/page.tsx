"use client";

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
  Activity
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
      const res = await apiJson<TraceStep[]>(`/v1/traces/${taskId}`);
      if (res.ok) {
        setSteps(res.data);
      }
      setLoading(false);
    }
    if (taskId) fetchTraces();
  }, [taskId]);

  const getStepIcon = (step: string) => {
    if (step.includes("memory")) return <Search size={18} className="text-blue-400" />;
    if (step.includes("reasoning") || step.includes("thinking")) return <Brain size={18} className="text-purple-400" />;
    if (step.includes("tool_execution")) return <Zap size={18} className="text-yellow-400" />;
    if (step.includes("complete")) return <CheckCircle2 size={18} className="text-green-400" />;
    return <Activity size={18} className="text-slate-400" />;
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-secondary hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Traces
      </button>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
            Trace View
          </span>
          <span className="text-secondary text-sm flex items-center gap-1">
            <Clock size={14} /> {steps.length > 0 ? new Date(steps[0].created_at).toLocaleString() : ""}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Task: <span className="font-mono text-accent-primary font-normal">{taskId}</span>
        </h1>
        <p className="text-secondary max-w-2xl">
          Visualizing the cognitive path and tool interactions of the agent during this task execution.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : steps.length === 0 ? (
        <div className="ac-card p-12 text-center text-secondary">
          No trace data found for this task.
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10 ml-[-0.5px]"></div>

          <div className="grid gap-8">
            {steps.map((step, index) => (
              <div key={step.trace_id} className="relative pl-14">
                {/* Timeline Dot */}
                <div className="absolute left-3 w-6 h-6 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center z-10 -ml-[11px] mt-1 shadow-lg shadow-black/50 overflow-hidden">
                  <div className="absolute inset-0 bg-accent-primary/5"></div>
                  {getStepIcon(step.step)}
                </div>

                <div className={`ac-card overflow-hidden transition-all duration-300 border border-white/5 ${expandedStep === step.trace_id ? 'ring-1 ring-accent-primary/30' : ''}`}>
                  <button 
                    onClick={() => setExpandedStep(expandedStep === step.trace_id ? null : step.trace_id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                  >
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        {step.step.replace(/_/g, " ").toUpperCase()}
                      </h3>
                      <p className="text-secondary text-xs">
                        {new Date(step.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {expandedStep === step.trace_id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  <div className={`transition-all duration-300 ${expandedStep === step.trace_id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="p-4 border-t border-white/5 bg-black/20">
                      {step.input_data && (
                        <div className="mb-4">
                          <label className="text-[10px] font-bold text-accent-primary uppercase tracking-widest mb-2 block">Input Context</label>
                          <pre className="p-3 bg-slate-900/50 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-40 overflow-auto border border-white/5">
                            {typeof step.input_data === 'string' ? step.input_data : JSON.stringify(step.input_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {step.output_data && (
                        <div>
                          <label className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2 block">Output Result</label>
                          <pre className="p-3 bg-slate-900/50 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-40 overflow-auto border border-white/5">
                            {typeof step.output_data === 'string' ? step.output_data : JSON.stringify(step.output_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
