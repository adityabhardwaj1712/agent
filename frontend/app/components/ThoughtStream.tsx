'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  BrainCircuit, 
  Database, 
  ShieldAlert, 
  ChevronRight
} from 'lucide-react';

interface Thought {
  step: string;
  details: string;
  timestamp: number;
}

export default function ThoughtStream({ taskId, onComplete }: { taskId: string, onComplete?: () => void }) {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'LOGIC' | 'SEARCH' | 'REVIEW' | 'DATA'>('ALL');
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
          setThoughts(prev => {
            // Avoid duplicate steps
            if (prev.some(t => t.step === msg.payload.step && t.details === msg.payload.details)) return prev;
            return [...prev, msg.payload];
          });
        } else if (msg.type === 'CHUNK') {
          // Flatten chunks if they are JSON stubs
          const chunkStr = typeof msg.payload === 'string' ? msg.payload : (msg.payload.chunk || JSON.stringify(msg.payload));
          setContent(prev => prev + chunkStr);
        }
      } catch (e) {
        console.error('Thought Stream Parse Error', e);
      }
    };

    ws.onclose = () => {
      setStatus('DONE');
      if (onComplete) onComplete();
    };

    return () => {
      ws.close();
    };
  }, [taskId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts, content, filter]);

  const getIcon = (step: string) => {
    const s = step.toLowerCase();
    if (s.includes('critic') || s.includes('review') || s.includes('evaluate')) return <ShieldAlert size={14} className="text-violet-400" />;
    if (s.includes('memory') || s.includes('database')) return <Database size={14} className="text-blue-400" />;
    if (s.includes('plan') || s.includes('logic')) return <BrainCircuit size={14} className="text-purple-400" />;
    if (s.includes('tool') || s.includes('search')) return <Cpu size={14} className="text-orange-400" />;
    return <Activity size={14} className="text-emerald-400" />;
  };

  const filteredThoughts = thoughts.filter(t => {
    if (filter === 'ALL') return true;
    const s = t.step.toLowerCase();
    if (filter === 'LOGIC') return s.includes('plan') || s.includes('logic');
    if (filter === 'SEARCH') return s.includes('tool') || s.includes('search') || s.includes('browser');
    if (filter === 'REVIEW') return s.includes('critic') || s.includes('review') || s.includes('evaluate');
    if (filter === 'DATA') return s.includes('output') || s.includes('result');
    return true;
  });

  return (
    <div className="flex flex-col gap-4 font-mono h-full overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-col gap-3 bg-black/40 border border-white/10 rounded-lg p-2">
         <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
               <Terminal size={14} className="text-slate-400" />
               <div className="text-[10px] uppercase tracking-widest font-bold text-slate-300">SWARM_INTERACTION_MONITOR</div>
            </div>
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${status === 'STREAMING' ? 'bg-[#2e6fff] animate-pulse' : 'bg-slate-600'}`} />
               <span className="text-[9px] text-slate-500 uppercase">{status}</span>
            </div>
         </div>
         
         <div className="flex gap-1 overflow-x-auto pb-1 px-1 scrollbar-hide">
            {(['ALL', 'LOGIC', 'SEARCH', 'REVIEW', 'DATA'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[8px] px-2 py-1 rounded border transition-all ${filter === f ? 'bg-[#2e6fff]/20 border-[#2e6fff] text-[#2e6fff]' : 'bg-white/5 border-white/5 text-slate-500'}`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      {/* Main Terminal Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide"
      >
        {filteredThoughts.map((t, i) => (
          <div key={i} className="flex gap-4 group animate-ms-fade-in relative">
             <div className="flex flex-col items-center gap-1 mt-1 z-10">
                <div className="p-1.5 rounded-md bg-[#06090f] border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                   {getIcon(t.step)}
                </div>
                {i < filteredThoughts.length - 1 && <div className="w-[1px] h-full bg-white/5" />}
             </div>
             <div className="pb-3 flex-1 border-b border-white/[0.03]">
                <div className="text-[10px] font-bold text-white/90 uppercase mb-1 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <span className="text-[#2e6fff] opacity-50">#</span>
                      {t.step.replace('_', ' ')}
                   </div>
                   <span className="text-[8px] opacity-30 font-mono tracking-tighter">NODE_{Math.round((t.timestamp % 1) * 1000)}</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed font-sans">{t.details}</div>
             </div>
          </div>
        ))}

        {content && (filter === 'ALL' || filter === 'DATA') && (
          <div className="mt-4 p-4 rounded-xl bg-[#2e6fff]/5 border border-[#2e6fff]/10 animate-ms-fade-in relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#2e6fff]/40" />
             <div className="text-[9px] uppercase tracking-tighter opacity-40 mb-3 ml-2 flex items-center gap-2">
                <ChevronRight size={10} /> FINAL_PAYLOAD_CHUNKS
             </div>
             <div className="text-[12px] text-blue-100/90 leading-relaxed pl-2 whitespace-pre-wrap">
                {content}
                {status === 'STREAMING' && <span className="inline-block w-2 h-4 ml-1 bg-[#2e6fff] animate-pulse align-middle" />}
             </div>
          </div>
        )}

        {status === 'STREAMING' && filteredThoughts.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 opacity-20 transition-all duration-1000">
              <div className="ms-loader-ring" style={{ width: 32, height: 32 }}></div>
              <div className="mt-6 text-[10px] tracking-[4px] font-black uppercase">Interpreting_Swarm_Pulses...</div>
           </div>
        )}
      </div>
    </div>
  );
}
