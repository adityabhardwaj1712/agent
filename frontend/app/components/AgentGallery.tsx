'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

export default function AgentGallery() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const data = await apiFetch<any[]>('/agents');
      setAgents(data);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch agents', 'err');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ms-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="ms-dot ms-dot-b ms-dot-pulse" style={{ transform: 'scale(2)' }}></div>
      </div>
    );
  }

  return (
    <div className="ms-content">
      {/* Registry Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input 
            type="text" 
            className="fi" 
            style={{ width: 320 }} 
            placeholder="Search agents by signature or role..." 
          />
          <div className="ms-badge ms-b-p">Total: {agents.length}</div>
        </div>
        <div className="ms-pill">
           Status: <span style={{ color: 'var(--green)', marginLeft: 4 }}>All Systems Nominal</span>
        </div>
      </div>

      <div className="ms-agent-grid">
        {agents.map((agent) => {
          const initials = agent.name.substring(0, 2).toUpperCase();
          const hue = agent.name.length * 45; // Deterministic color
          const stateColor = agent.status === 'error' ? 'var(--red)' : agent.status === 'busy' ? 'var(--amber)' : 'var(--blue)';
          
          return (
            <div className="ms-ac" key={agent.agent_id} style={{ '--kc': stateColor } as any}>
              <div className="ms-ac-top">
                <div 
                  className="ms-ac-avatar" 
                  style={{ 
                    background: `linear-gradient(135deg, hsl(${hue},70%,20%), hsl(${hue + 40},70%,30%))`,
                    border: `1px solid hsl(${hue},70%,50%)`,
                    color: `hsl(${hue},100%,80%)`,
                    fontWeight: 700,
                    fontFamily: 'var(--mono)'
                  }}
                >
                  {initials}
                </div>
                <div className={`ms-badge ${agent.status === 'error' ? 'ms-b-r' : 'ms-b-g'}`}>
                   {agent.status || 'Active'}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div className="ms-ac-name">{agent.name}</div>
                <div className="ms-ac-role">{agent.role}</div>
              </div>
              
              <div className="ms-ac-stats">
                <div className="ms-ac-stat">
                  <div className="ms-ac-sv">{agent.total_tasks || 0}</div>
                  <div className="ms-ac-sl">Missions</div>
                </div>
                <div className="ms-ac-stat">
                  <div className="ms-ac-sv">{agent.reputation_score || 95}</div>
                  <div className="ms-ac-sl">Trust</div>
                </div>
                <div className="ms-ac-stat">
                   <div className="ms-ac-sv" style={{ color: 'var(--green)' }}>{agent.success_rate || 99}%</div>
                   <div className="ms-ac-sl">Yield</div>
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                 <button className="ms-btn ms-btn-g ms-btn-sm" style={{ flex: 1 }}>Configure</button>
                 <button className="ms-btn ms-btn-p ms-btn-sm">Logs</button>
              </div>
            </div>
          );
        })}
        {agents.length === 0 && (
           <div className="ms-card" style={{ gridColumn: 'span 3', padding: 40, textAlign: 'center' }}>
              <div style={{ color: 'var(--t3)', fontSize: 24, marginBottom: 16 }}>∅</div>
              <div style={{ color: 'var(--t2)' }}>No agents found in this sector.</div>
              <button className="ms-btn ms-btn-p ms-btn-sm" style={{ marginTop: 20 }}>+ Register New Agent</button>
           </div>
        )}
      </div>
    </div>
  );
}
