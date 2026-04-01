'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Terminal,
  Cpu,
  Search,
  Database,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { wsUrl } from '../lib/api';

interface Step {
  task_id: string;
  step: string;
  details: string;
  timestamp: number;
}

interface StepMonitorProps {
  taskId: string;
  userId: string;
  onClose?: () => void;
}

export default function StepMonitor({ taskId, userId, onClose }: StepMonitorProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = wsUrl(`/ws/tasks?user_id=${userId}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(`subscribe:task:${taskId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.task_id === taskId && data.step) {
          setSteps(prev => [...prev, data as Step]);
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    ws.onerror = () => setConnected(false);
    ws.onclose = () => setConnected(false);

    return () => {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    };
  }, [taskId, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  const getStepIcon = (stepName: string) => {
    const s = stepName.toLowerCase();
    if (s.includes('memory')) return <Database size={14} className="text-[var(--blue)]" />;
    if (s.includes('llm') || s.includes('calling')) return <Cpu size={14} className="text-[var(--violet)]" />;
    if (s.includes('tool') || s.includes('executing')) return <Zap size={14} className="text-[var(--amber)]" />;
    if (s.includes('security')) return <AlertCircle size={14} className="text-[var(--red)]" />;
    if (s.includes('quality')) return <CheckCircle2 size={14} className="text-[var(--green)]" />;
    return <Activity size={14} className="text-[var(--t2)]" />;
  };

  return (
    <div className="ms-glass-panel flex flex-col h-full overflow-hidden" style={{ minWidth: '400px' }}>
      <div className="ms-card-hd flex justify-between items-center py-4 px-6 border-b border-[var(--bg3)]">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-[var(--cyan)]" />
          <div>
            <div className="text-[12px] font-black tracking-widest text-[var(--text)] uppercase">LIVE_EXECUTION_LOG</div>
            <div className="flex items-center gap-2 mt-0.5">
               <div className={`ms-dot ${connected ? 'ms-dot-g' : 'ms-dot-r'} ${connected && 'animate-pulse'}`} />
               <span className="text-[9px] font-mono text-[var(--t3)] uppercase">{connected ? 'Stream: Active' : 'Stream: Offline'}</span>
            </div>
          </div>
        </div>
        {onClose && (
          <button className="ms-btn-icon-sm" onClick={onClose}>
            <ExternalLink size={14} />
          </button>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {steps.length === 0 ? (
          <div className="flex-center flex-col h-full opacity-20">
             <Loader2 size={32} className="animate-spin mb-4" />
             <div className="text-[10px] font-bold tracking-widest">AWAITING_INITIAL_STEP_SIGNAL...</div>
          </div>
        ) : (
          steps.map((s, i) => (
            <div key={i} className="ms-step-item animate-in fade-in slide-in-from-left-2 duration-300">
               <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                     <div className="w-8 h-8 rounded-lg bg-[var(--bg3)] border border-[var(--border)] flex-center shadow-lg">
                        {getStepIcon(s.step)}
                     </div>
                     {i < steps.length - 1 && (
                        <div className="w-[1px] flex-1 bg-[var(--bg3)] my-2" />
                     )}
                  </div>
                  
                  <div className="flex-1 pt-1 pb-4">
                     <div className="flex justify-between items-center mb-1">
                        <div className="text-[11px] font-black text-[var(--t2)] uppercase tracking-wider">{s.step}</div>
                        <div className="text-[9px] font-mono text-[var(--t3)] flex items-center gap-1">
                           <Clock size={8} /> {new Date(s.timestamp * 1000).toLocaleTimeString()}
                        </div>
                     </div>
                     <div className="text-[13px] text-[var(--t1)] leading-relaxed bg-[rgba(255,255,255,0.02)] p-3 rounded-lg border border-[rgba(255,255,255,0.03)] selection:bg-[var(--blue)]">
                        {s.details}
                     </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-[var(--bg1)] border-t border-[var(--bg3)]">
         <div className="flex items-center justify-between px-2">
            <div className="text-[10px] font-mono text-[var(--t3)]">TASK_UUID: <span className="text-[var(--blue)]">{taskId.slice(0, 8)}</span></div>
            <div className="text-[10px] font-mono text-[var(--t3)]">TOTAL_STEPS: <span className="text-[var(--green)]">{steps.length}</span></div>
         </div>
      </div>

      <style jsx>{`
        .ms-step-item:last-child {
          animation: glow-pulse 2s infinite;
        }
        @keyframes glow-pulse {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.2) drop-shadow(0 0 5px rgba(0, 212, 255, 0.2)); }
          100% { filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}
