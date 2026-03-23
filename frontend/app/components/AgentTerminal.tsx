"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Zap, Activity, ShieldCheck, ChevronRight } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const SAMPLE_LOGS: LogEntry[] = [
  { id: '1', timestamp: '13:04:01', agent: 'Orchestrator', message: 'Analyzing task complexity...', type: 'info' },
  { id: '2', timestamp: '13:04:05', agent: 'Researcher', message: 'Querying vector database for internal docs', type: 'info' },
  { id: '3', timestamp: '13:04:12', agent: 'Researcher', message: 'Retrieved 12 relevant context chunks', type: 'success' },
  { id: '4', timestamp: '13:04:15', agent: 'Coder', message: 'Generating implementation plan...', type: 'info' },
];

export default function AgentTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>(SAMPLE_LOGS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const agents = ['Orchestrator', 'Researcher', 'Coder', 'Reviewer', 'Guardian'];
      const actions = [
        'Optimizing prompt tokens...',
        'Validating output schema',
        'Intercepting potential safety violation',
        'Cross-referencing domain knowledge',
        'Executing tool: search_web',
        'Self-correcting reasoning path',
      ];
      
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        agent: agents[Math.floor(Math.random() * agents.length)],
        message: actions[Math.floor(Math.random() * actions.length)],
        type: Math.random() > 0.8 ? 'warning' : 'info',
      };

      setLogs(prev => [...prev.slice(-15), newLog]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full glass-card rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Terminal size={16} className="text-indigo-500" />
          <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Agent_Stream_Log</span>
        </div>
        <div className="flex items-center gap-4">
          <Activity size={14} className="text-green-500 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-6 font-mono text-sm overflow-y-auto space-y-5 scrollbar-hide bg-black/20"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 animate-slide-in group relative">
             <div className="absolute -left-2 top-0 bottom-0 w-[1px] bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            
            <div className="flex flex-col gap-1 w-full translate-x-0 group-hover:translate-x-2 transition-transform duration-300">
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-tertiary uppercase tracking-tighter opacity-40">{log.timestamp}</span>
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border tracking-widest uppercase ${
                   log.type === 'warning' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                 }`}>
                   {log.agent}
                 </span>
              </div>
              <div className="flex items-start gap-2">
                 <ChevronRight size={12} className="text-indigo-500/40 mt-1" />
                 <span className={`text-[13px] font-black tracking-tight uppercase leading-relaxed ${
                   log.type === 'warning' ? 'text-red-400 opacity-90' : 'text-secondary group-hover:text-primary'
                 }`}>
                   {log.message}
                 </span>
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex gap-2 items-center pt-4 opacity-30">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
          <span className="text-[9px] font-black tracking-widest ml-2 uppercase">Awaiting_Next_Response...</span>
        </div>
      </div>
    </div>
  );
}
