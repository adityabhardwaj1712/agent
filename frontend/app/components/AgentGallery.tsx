'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export default function AgentGallery() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchAgents = async () => {
    try {
      const data = await apiFetch<any[]>('/agents');
      setAgents(data || []);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const filteredAgents = filter === '' ? agents : agents.filter(a => a.status === filter);

  if (loading) return <div className="p-8 mono text-t3 animate-pulse">Scanning Agent Fleet...</div>;

  return (
    <div className="view-body">
      <div className="flex items-center gap-3 mb-6">
        <input 
          className="fi max-w-[260px]" 
          placeholder="Search agents..." 
          onChange={(e) => {
            const term = e.target.value.toLowerCase();
            if (!term) fetchAgents();
            else setAgents(prev => prev.filter(a => a.name.toLowerCase().includes(term)));
          }}
        />
        <select className="fs w-[140px]" onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="busy">Busy</option>
        </select>
        <button className="btn btn-p btn-sm ml-auto">+ Register Agent</button>
      </div>

      <div className="agents-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.length === 0 && <div className="col-span-full p-12 text-center text-t3 mono">No agents found in registry.</div>}
        {filteredAgents.map((a) => {
          // Status mapping for demo
          const status = a.total_tasks > 0 ? 'active' : 'idle';
          const col = a.color || '#5b8cff';
          const sc = { active: 'var(--g)', busy: 'var(--y)', idle: 'var(--t3)' }[status as 'active'|'busy'|'idle'];
          
          return (
            <div key={a.agent_id} className="agent-card group">
              <div className="ac-top flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="ac-avatar w-[38px] h-[38px] rounded-[9px] flex items-center justify-center text-[17px] shrink-0" 
                       style={{ background: `${col}22`, border: `1px solid ${col}44` }}>
                    {a.emoji || '🤖'}
                  </div>
                  <div>
                    <div className="ac-name text-[13px] font-bold">{a.name}</div>
                    <div className="ac-role text-[10px] text-t3 mono">{a.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] mono font-bold" style={{ color: sc }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc }}></span>
                  {status.toUpperCase()}
                </div>
              </div>

              <p className="text-[11px] text-t2 line-clamp-2 mb-3 h-8">{a.description}</p>

              <div className="ac-stats grid grid-cols-3 gap-1.5 mt-2">
                <div className="ac-stat bg-bg3 p-1.5 px-2 rounded-[7px]">
                  <div className="ac-stat-val text-[14px] mono font-bold">{a.total_tasks}</div>
                  <div className="ac-stat-lbl text-[9px] text-t3 uppercase">Total</div>
                </div>
                <div className="ac-stat bg-bg3 p-1.5 px-2 rounded-[7px]">
                  <div className="ac-stat-val text-[14px] mono font-bold text-g">{a.successful_tasks}</div>
                  <div className="ac-stat-lbl text-[9px] text-t3 uppercase">Success</div>
                </div>
                <div className="ac-stat bg-bg3 p-1.5 px-2 rounded-[7px]">
                  <div className="ac-stat-val text-[14px] mono font-bold text-r">{a.failed_tasks}</div>
                  <div className="ac-stat-lbl text-[9px] text-t3 uppercase">Failed</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-t3 mb-1 font-bold">
                  <span>Reputation Score</span>
                  <span>{a.reputation_score}%</span>
                </div>
                <div className="rep-bar h-[3px] bg-bg3 rounded-full overflow-hidden">
                  <div className="rep-fill h-full rounded-full transition-all duration-1000" 
                       style={{ width: `${a.reputation_score}%`, background: 'linear-gradient(90deg, var(--a), var(--a2))' }}></div>
                </div>
              </div>

              <div className="ac-actions flex gap-1.5 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="btn btn-xs btn-p shrink-0">Run Task</button>
                <button className="btn btn-xs btn-g shrink-0">Traces</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
