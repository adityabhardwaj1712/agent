'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from '../ui/Toast';
import { 
  History, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function OptimizationHistory({ agentId }: { agentId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchHistory();
  }, [agentId]);

  const fetchHistory = async () => {
    try {
      const data = await apiFetch<any[]>(`/agents/${agentId}/optimization-history`);
      setHistory(data || []);
    } catch (e) {
      console.error('Failed to fetch opt history', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      await apiFetch(`/agents/${agentId}/optimize`, { method: 'POST' });
      toast('Neural optimization complete!', 'ok');
      fetchHistory();
    } catch (e: any) {
      toast('Optimization failed: ' + e.message, 'err');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) return <div className="p-8 text-center opacity-40 text-[10px] font-bold tracking-widest">LOADING_TIMELINE...</div>;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="ms-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
               <Zap size={18} className="text-[var(--green)]" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>PROMPT_EVOLUTION_LOG</div>
         </div>
         <button 
           className="ms-btn ms-btn-p ms-btn-sm" 
           onClick={handleOptimize}
           disabled={optimizing}
         >
           {optimizing ? <RefreshCw size={12} className="animate-spin mr-2" /> : <Sparkles size={12} className="mr-2" />}
           {optimizing ? 'EVOLVING...' : 'TRIGGER_OPTIMIZATION'}
         </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {history.length === 0 ? (
          <div className="flex-center flex-col py-16 opacity-30 border-2 border-dashed border-[var(--bg3)] rounded-2xl">
             <History size={40} className="mb-4" />
             <div style={{ fontSize: '11px', fontWeight: 700 }}>NO_HISTORICAL_MUTATIONS_RECORDED</div>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="ms-card relative" style={{ background: 'rgba(255,255,255,0.02)' }}>
               <div className="p-4 border-b border-[var(--bg3)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Clock size={12} className="text-[var(--t3)]" />
                     <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--t3)' }}>
                        {new Date(item.timestamp * 1000).toLocaleString()}
                     </span>
                  </div>
                  <div className="ms-badge ms-b-g" style={{ fontSize: 9 }}>STABLE_STATE</div>
               </div>
               <div className="p-4">
                  <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>{item.insight}</div>
                  <div className="bg-black/40 p-4 rounded-lg border border-[var(--bg3)] font-mono text-[10px] leading-relaxed text-[var(--t2)] max-h-[120px] overflow-y-auto">
                     {item.prompt}
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
