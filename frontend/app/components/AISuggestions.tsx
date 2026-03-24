'use client';

import React, { useEffect, useState } from 'react';
import { apiJson } from '../lib/api';
import { Sparkles, RefreshCw, Zap, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Suggestion {
  type: 'retry' | 'performance' | 'cost';
  title: string;
  description: string;
  action: string;
  agent_id?: string;
  severity: 'info' | 'warning' | 'critical';
}

export default function AISuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const data = await apiJson('/tasks/suggestions');
      setSuggestions(data || []);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    const interval = setInterval(fetchSuggestions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string) => {
    setActing(action);
    try {
      if (action === 'retry_failed') {
        await apiJson('/tasks/retry', { method: 'POST' });
        // Refresh after action
        setTimeout(fetchSuggestions, 1000);
      } else {
        console.log('Action not implemented yet:', action);
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActing(null);
    }
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-border/20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-8 text-center bg-card2/50 rounded-xl border border-dashed border-border flex flex-col items-center">
        <ShieldCheck size={32} className="text-tertiary mb-3 opacity-20" />
        <div className="text-sm font-medium text-secondary">System Optimized</div>
        <div className="text-xs text-tertiary mt-1">No pending issues detected</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((s, idx) => (
        <div 
          key={idx} 
          className={`suggestion-card p-4 rounded-xl border animate-slide-in flex flex-col gap-3 transition-all hover:bg-card2/80
            ${s.severity === 'critical' ? 'border-r/30 bg-r/5' : 
              s.severity === 'warning' ? 'border-y/30 bg-y/5' : 'border-border bg-card2/40'}
          `}
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                s.type === 'retry' ? 'bg-r/10 text-r' : 
                s.type === 'performance' ? 'bg-a/10 text-a' : 'bg-g/10 text-g'
              }`}>
                {s.type === 'retry' && <RefreshCw size={14} />}
                {s.type === 'performance' && <TrendingUp size={14} />}
                {s.type === 'cost' && <Zap size={14} />}
              </div>
              <div className="text-sm font-semibold tracking-tight">{s.title}</div>
            </div>
            {s.severity === 'critical' && <AlertTriangle size={14} className="text-r animate-pulse" />}
          </div>
          
          <div className="text-xs text-tertiary leading-relaxed">
            {s.description}
          </div>

          <button 
            onClick={() => handleAction(s.action)}
            disabled={acting !== null}
            className={`btn btn-sm w-full font-mono text-[10px] uppercase tracking-wider
              ${s.severity === 'critical' ? 'btn-r' : s.severity === 'warning' ? 'btn-y' : 'btn-a'}
            `}
          >
            {acting === s.action ? (
              <RefreshCw size={12} className="animate-spin mr-2" />
            ) : (
              <Sparkles size={12} className="mr-2" />
            )}
            Execute Suggestion
          </button>
        </div>
      ))}
    </div>
  );
}
