"use client";
import React from "react";
import { Cpu, Zap, Layers, Activity, Database, Share2, Globe, Shield, Terminal, Boxes } from "lucide-react";

interface ProtocolGraphProps {
  events: any[];
}

export default function ProtocolGraph({ events }: ProtocolGraphProps) {
  // Build node data from events or use fallback
  interface Node { id: string; label: string; type: 'agent' | 'task' | 'endpoint'; }
  const agents: Node[] = [];
  const tasks: Node[] = [];
  const endpoints: Node[] = [];
  
  const seenAgents = new Set<string>();
  const seenTasks = new Set<string>();

  const eventsSlice = (events || []).slice(0, 4);

  if (eventsSlice.length > 0) {
    eventsSlice.forEach((event) => {
      const agentId = event.agent_id || "System";
      const taskId = event.task_id || "Global";
      if (!seenAgents.has(agentId)) {
        agents.push({ id: agentId, label: agentId.slice(0, 8), type: 'agent' });
        seenAgents.add(agentId);
      }
      if (!seenTasks.has(taskId)) {
        tasks.push({ id: taskId, label: event.step || event.event_type || "Process", type: 'task' });
        seenTasks.add(taskId);
      }
    });
  } else {
    agents.push({ id: "claude", label: "CLD-3.5", type: 'agent' });
    agents.push({ id: "gpt4o", label: "GPT-4O", type: 'agent' });
    tasks.push({ id: "t1", label: "ANALYSIS_CORE", type: 'task' });
    tasks.push({ id: "t2", label: "VECTOR_SYNC", type: 'task' });
  }

  endpoints.push({ id: "e1", label: "MAIN_ORBIT", type: 'endpoint' });
  endpoints.push({ id: "e2", label: "SECURE_HUB", type: 'endpoint' });

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center gap-24 p-12 overflow-hidden bg-black/20 rounded-[3rem] border border-white/5 shadow-inner">
      {/* Neural Grid Background */}
      <div className="absolute inset-0 opacity-20" style={{ 
        backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px' 
      }} />
      <div className="absolute inset-0 bg-radial-at-c from-indigo-500/5 via-transparent to-transparent pointer-none" />

      {/* Column 1: Agents */}
      <div className="flex flex-col gap-10 z-10">
        {agents.map((agent, i) => (
          <div key={agent.id} className="glass-card px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-indigo-500/40 transition-all group animate-slide-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">
               <Cpu size={20} />
            </div>
            <div>
               <div className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">Matrix_Node</div>
               <div className="text-[13px] font-black text-primary tracking-tight uppercase">{agent.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SVG Connections 1 */}
      <svg className="absolute w-full h-full pointer-events-none" style={{ zRelative: 5 }}>
        <defs>
          <linearGradient id="axon-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </linearGradient>
          <filter id="axon-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {agents.map((_, i) => (
           <path 
             key={i}
             d={`M 280 ${130 + i * 85} C 350 ${130 + i * 85}, 350 200, 450 200`} 
             fill="none" 
             stroke="url(#axon-grad)" 
             strokeWidth="2" 
             strokeDasharray="8 6"
             className="animate-pulse"
             filter="url(#axon-glow)"
           >
             <animate attributeName="stroke-dashoffset" from="100" to="0" dur="10s" repeatCount="indefinite" />
           </path>
        ))}
      </svg>

      {/* Column 2: Tasks */}
      <div className="flex flex-col gap-10 z-10 translate-y-4">
        {tasks.map((task, i) => (
          <div key={task.id} className="glass-card px-8 py-5 rounded-[2rem] border border-indigo-500/20 flex items-center gap-5 hover:border-indigo-500 group cursor-pointer animate-slide-in shadow-[0_12px_40px_rgba(0,0,0,0.3)]" style={{ animationDelay: `0.3s` }}>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
               <Boxes size={24} />
            </div>
            <div>
               <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 opacity-60">Execution_Unit</div>
               <div className="text-[15px] font-black text-primary tracking-tight uppercase group-hover:text-indigo-400 transition-colors">{task.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SVG Connections 2 */}
      <svg className="absolute w-full h-full pointer-events-none">
        {tasks.map((_, i) => (
           <path 
             key={i}
             d={`M 650 200 C 720 200, 720 ${130 + i * 85}, 800 ${130 + i * 85}`} 
             fill="none" 
             stroke="url(#axon-grad)" 
             strokeWidth="2" 
             strokeDasharray="4 8"
             filter="url(#axon-glow)"
           >
              <animate attributeName="stroke-dashoffset" from="50" to="0" dur="6s" repeatCount="indefinite" />
           </path>
        ))}
      </svg>

      {/* Column 3: Endpoints */}
      <div className="flex flex-col gap-10 z-10">
        {endpoints.map((ep, i) => (
          <div key={ep.id} className="glass-card px-6 py-4 rounded-2xl border border-white/10 flex flex-row-reverse items-center gap-4 hover:border-green-500/40 transition-all group animate-slide-in" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all">
               <Globe size={20} />
            </div>
            <div className="text-right">
               <div className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">System_Exit</div>
               <div className="text-[13px] font-black text-primary tracking-tight uppercase">{ep.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Status Particles */}
      <div className="absolute top-10 right-10 flex items-center gap-3 animate-pulse">
         <Radio size={14} className="text-indigo-500" />
         <span className="text-[9px] font-black text-tertiary uppercase tracking-[0.4em] opacity-40 whitespace-nowrap">SYNAPTIC_STREAM_UP</span>
      </div>
    </div>
  );
}
