'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getToken } from '../../lib/api';

/**
 * ThoughtStream Hub Component
 * -----------------------------------------------------------------------------
 * Provides a real-time, filterable log of mission execution steps and tokens
 * using Server-Sent Events (SSE).
 * -----------------------------------------------------------------------------
 */

interface StreamEvent {
  type: 'token' | 'step' | 'status';
  token?: string;
  data?: any;
  status?: string;
  done: boolean;
  timestamp: number;
}

interface ThoughtStreamProps {
  taskId: string;
  active?: boolean;
}

export default function ThoughtStream({ taskId, active = true }: ThoughtStreamProps) {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'LOGIC' | 'DATA' | 'TOKENS'>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!taskId || !active) return;

    const token = getToken();
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${hostname}:8000`;
    const url = `${baseUrl}/v1/tasks/${taskId}/stream${token ? `?token=${token}` : ''}`;
    
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        const event: StreamEvent = {
          ...raw,
          timestamp: Date.now()
        };
        setEvents(prev => [...prev, event]);
        
        if (event.done) {
          es.close();
        }
      } catch (err) {
        console.error("SSE Parse Error", err);
      }
    };

    es.onerror = (err) => {
      console.error("SSE Connection Error", err);
      es.close();
    };

    return () => {
      es.close();
    };
  }, [taskId, active]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const filteredEvents = events.filter(e => {
    if (filter === 'ALL') return true;
    if (filter === 'TOKENS') return e.type === 'token';
    if (filter === 'LOGIC' && e.type === 'step') return e.data?.step?.includes('logic') || e.data?.step?.includes('decide');
    if (filter === 'DATA' && e.type === 'step') return e.data?.step?.includes('memory') || e.data?.step?.includes('search');
    return true;
  });

  return (
    <div className="thought-stream-hub card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      {/* Header / Tabs */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {['ALL', 'LOGIC', 'DATA', 'TOKENS'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f as any)}
              className={`btn-subtle ${filter === f ? 'active' : ''}`}
              style={{ fontSize: 9, padding: '2px 8px' }}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="pill pill-blue" style={{ fontSize: 9 }}>THOUGHT_STREAM</span>
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: 'var(--bg2)', fontFamily: 'var(--mono)', fontSize: 11 }}>
        {filteredEvents.length === 0 && (
          <div style={{ color: 'var(--t3)', textAlign: 'center', marginTop: 40, opacity: 0.5 }}>
            WAITING_FOR_SIGNALS...
          </div>
        )}
        {filteredEvents.map((e, i) => (
          <div key={i} style={{ marginBottom: 4, display: 'flex', gap: 8 }}>
            <span style={{ color: 'var(--t3)', minWidth: 60 }}>[{new Date(e.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            {e.type === 'token' && <span style={{ color: 'var(--blue)' }}>{e.token}</span>}
            {e.type === 'step' && (
              <span style={{ color: 'var(--cyan)' }}>
                <b style={{ color: 'var(--orange)' }}>[STEP:{e.data?.step}]</b> {e.data?.agent_id} initialized...
              </span>
            )}
            {e.type === 'status' && (
              <span style={{ color: e.status === 'completed' ? 'var(--green)' : 'var(--red)' }}>
                <b>*** {e.status?.toUpperCase()} ***</b>
              </span>
            )}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .btn-subtle {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--t2);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .btn-subtle:hover {
          border-color: var(--blue);
          color: var(--blue);
        }
        .btn-subtle.active {
          background: var(--blue);
          color: white;
          border-color: var(--blue);
        }
      `}</style>
    </div>
  );
}
