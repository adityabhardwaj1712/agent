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
      {/* Search Header */}
      <div style={{ display: 'flex', gap: 16 }}>
        <input 
          type="text" 
          className="fi" 
          style={{ flex: 1 }} 
          placeholder="Search registered agents by name or role..." 
        />
        <select className="fi" style={{ width: 180 }}>
          <option>All Scopes</option>
          <option>Read Memory</option>
          <option>Run Tasks</option>
        </select>
      </div>

      <div className="ms-agent-grid">
        {agents.map((agent) => {
          const initials = agent.name.substring(0, 2).toUpperCase();
          const hue = agent.name.length * 30; // Random deterministic color
          
          return (
            <div className="ms-ac" key={agent.agent_id}>
              <div className="ms-ac-top">
                <div 
                  className="ms-ac-avatar" 
                  style={{ background: `linear-gradient(135deg, hsl(${hue},70%,50%), hsl(${hue + 40},70%,50%))` }}
                >
                  {initials}
                </div>
                <div className="ms-badge ms-b-g">Active</div>
              </div>
              <div className="ms-ac-name">{agent.name}</div>
              <div className="ms-ac-role">{agent.role}</div>
              
              <div className="ms-ac-stats">
                <div className="ms-ac-stat">
                  <div className="ms-ac-sv">{agent.reputation_score || 0}</div>
                  <div className="ms-ac-sl">Reputation</div>
                </div>
                <div className="ms-ac-stat">
                  <div className="ms-ac-sv">{agent.total_tasks || 0}</div>
                  <div className="ms-ac-sl">Tasks</div>
                </div>
                <div className="ms-ac-stat">
                  <div className="ms-ac-sv">{agent.successful_tasks || 0}</div>
                  <div className="ms-ac-sl">Success</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
