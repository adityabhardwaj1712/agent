'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  BrainCircuit, 
  Database, 
  ShieldAlert, 
  ChevronRight,
  Loading
} from 'lucide-react';

interface Thought {
  step: string;
  details: string;
  timestamp: number;
}

export default function ThoughtStream({ taskId, onComplete }: { taskId: string, onComplete?: () => void }) {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'STREAMING' | 'DONE'>('IDLE');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!taskId) return;

    setThoughts([]);
    setContent('');
    setStatus('STREAMING');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/api/v1/websocket/task-stream/${taskId}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'THOUGHT') {
          setThoughts(prev => [...prev, msg.payload]);
        } else if (msg.type === 'CHUNK') {
          // Flatten chunks if they are JSON stubs
          const chunkStr = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
          setContent(prev => prev + (msg.payload.chunk || chunkStr));
        }
      } catch (e) {
        console.error('Thought Stream Parse Error', e);
      }
    };

    ws.onclose = () => {
      setStatus('DONE');
      if (onComplete) onComplete();
    };

    return () => ws.close();
  }, [taskId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts, content]);

  const getIcon = (step: string) => {
    const s = step.toLowerCase();
    if (s.includes('security')) return <ShieldAlert size={14} className="text-red-400" />;
    if (s.includes('memory')) return <Database size={14} className="text-blue-400" />;
    if (s.includes('llm')) return <BrainCircuit size={14} className="text-purple-400" />;
    if (s.includes('tool')) return <Cpu size={14} className="text-orange-400" />;
    return <Activity size={14} className="text-emerald-400" />;
  };

  return (
    <div className="flex flex-col gap-4 font-mono h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 border border-white/10 rounded-lg">
         <div className="flex items-center gap-3">
            <Terminal size={14} className="text-slate-400" />
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">NEURAL_DECOMPOSITION_ENGINE</div>
         </div>
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'STREAMING' ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[9px] text-slate-500">{status}</span>
         </div>
      </div>

      {/* Main Terminal Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide"
        style={{ padding: '4px' }}
      >
        {/* Step Thread */}
        {thoughts.map((t, i) => (
          <div key={i} className="flex gap-4 group animate-ms-fade-in">
             <div className="flex flex-col items-center gap-1 mt-1">
                <div className="p-1.5 rounded-md bg-white/5 border border-white/5">
                   {getIcon(t.step)}
                </div>
                {i < thoughts.length - 1 && <div className="w-[1px] h-full bg-slate-800" />}
             </div>
             <div className="pb-3 flex-1 border-b border-white/[0.03]">
                <div className="text-[10px] font-bold text-white/90 uppercase mb-1 flex items-center gap-2">
                   {t.step.replace('_', ' ')}
                   <span className="text-[8px] opacity-30">+{Math.round((t.timestamp % 1) * 1000)}ms</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed font-sans">{t.details}</div>
             </div>
          </div>
        ))}

        {/* Streaming Content */}
        {content && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--blue)]/5 border border-[var(--blue)]/10 animate-ms-fade-in relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-[var(--blue)]/20" />
             <div className="text-[9px] uppercase tracking-tighter opacity-40 mb-3 ml-2 flex items-center gap-2">
                <ChevronRight size={10} /> OUTPUT_STREAM_CHUNKS
             </div>
             <div className="text-[12px] text-blue-100/90 leading-relaxed pl-2 whitespace-pre-wrap">
                {content}
                {status === 'STREAMING' && <span className="inline-block w-2 h-4 ml-1 bg-blue-400/50 animate-pulse align-middle" />}
             </div>
          </div>
        )}

        {status === 'STREAMING' && thoughts.length === 0 && (
           <div className="flex-center py-20 flex-col opacity-20">
              <div className="ms-loader-ring" style={{ width: 32, height: 32 }}></div>
              <div className="mt-6 text-[10px] tracking-[4px]">INITIALIZING_TRACE_HOOKS...</div>
           </div>
        )}
      </div>
    </div>
  );
}
