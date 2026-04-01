'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';
import OptimizationHistory from './OptimizationHistory';

// Sparkline drawing
function drawSparkline(canvas: HTMLCanvasElement, base: number, status: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.offsetWidth || 200, h = 36;
  canvas.width = w;
  canvas.height = h;

  const color = status === 'online' || status === 'active' ? '#00b4f0'
    : status === 'degraded' ? '#f59e0b' : '#ef4444';

  const pts: number[] = [];
  let v = base;
  for (let i = 0; i < 22; i++) {
    v = Math.max(3, Math.min(100, v + (Math.random() - 0.5) * 15));
    pts.push(v);
  }

  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, color + '55');
  g.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(0, h - (pts[0] / 100) * h);
  pts.forEach((p, i) => ctx.lineTo((i / (pts.length - 1)) * w, h - (p / 100) * h));
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, h - (pts[0] / 100) * h);
  pts.forEach((p, i) => ctx.lineTo((i / (pts.length - 1)) * w, h - (p / 100) * h));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function AgentSparkline({ health, status }: { health: number; status: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawSparkline(canvasRef.current, health, status);
    }
  }, [health, status]);

  return (
    <div className="spk-wrap">
      <canvas ref={canvasRef} className="spk" />
    </div>
  );
}

export default function AgentGallery() {
  const [agents, setAgents] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const data = await apiFetch<any[]>('/agents');
      setAgents(data || []);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch agents', 'err');
    } finally {
      setLoading(false);
    }
  };

  const calculateHealth = (agent: any) => {
    const successRate = agent.total_tasks > 0 ? (agent.successful_tasks / agent.total_tasks) * 100 : (agent.success_rate || 99);
    return Math.round(((agent.reputation_score || 98) * 0.4) + (successRate * 0.6));
  };

  const getAgentType = (agent: any): string => {
    const role = (agent.role || '').toLowerCase();
    if (role.includes('core') || role.includes('analytics') || role.includes('orchestrat')) return 'Core';
    if (role.includes('storage') || role.includes('data') || role.includes('memory')) return 'Storage';
    if (role.includes('ai') || role.includes('ml') || role.includes('model')) return 'AI';
    return 'Worker';
  };

  const getTypeIcon = (type: string) => {
    return { Core: '⚙', Worker: '🔩', Storage: '🗄', AI: '🧠' }[type] || '🤖';
  };

  const getTypeClass = (type: string) => {
    return { Core: 'icon-core', Worker: 'icon-worker', Storage: 'icon-storage', AI: 'icon-ai' }[type] || 'icon-worker';
  };

  const getStatus = (agent: any) => {
    if (agent.status) return agent.status;
    const health = calculateHealth(agent);
    if (health > 80) return 'online';
    if (health > 50) return 'degraded';
    return 'offline';
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Terminate this agent?')) return;
    try {
      await apiFetch(`/agents/${id}`, { method: 'DELETE' });
      toast('Agent terminated', 'ok');
      fetchAgents();
      if (selectedAgentId === id) setSelectedAgentId(null);
    } catch (e: any) {
      toast(e.message, 'err');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ color: 'var(--t3)', letterSpacing: 2, fontSize: 10, fontFamily: 'var(--mono)' }}>SYNCHRONIZING_FLEET_REGISTRY...</div>
      </div>
    );
  }

  const filteredAgents = agents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(filter.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === 'All' || getAgentType(a) === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ animation: 'pageIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Agent Fleet</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>
            {agents.length} agents across {new Set(agents.map(a => getAgentType(a))).size} types
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => (window as any).openAddAgent?.()}>+ Add Agent</button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="fsearch">
          <span style={{ color: 'var(--t3)', fontSize: 12 }}>⌕</span>
          <input
            type="text"
            placeholder="Search agents..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        {['All', 'Core', 'Worker', 'Storage', 'AI'].map(type => (
          <button
            key={type}
            className={`fbtn ${typeFilter === type ? 'active' : ''}`}
            onClick={() => setTypeFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedAgentId ? '1fr 380px' : '1fr', gap: 16 }}>
        {/* Agent Cards Grid */}
        <div className="agents-grid">
          {filteredAgents.map(agent => {
            const type = getAgentType(agent);
            const health = calculateHealth(agent);
            const status = getStatus(agent);
            const isSelected = selectedAgentId === agent.agent_id;

            return (
              <div
                key={agent.agent_id}
                className="agent-card"
                style={isSelected ? { borderColor: 'var(--blue)' } : {}}
                onClick={() => setSelectedAgentId(isSelected ? null : agent.agent_id)}
              >
                <div className="agent-card-hdr">
                  <div className={`agent-icon ${getTypeClass(type)}`}>
                    {getTypeIcon(type)}
                  </div>
                  <div className="agent-info">
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-id">{agent.agent_id?.slice(0, 8)}</div>
                  </div>
                  <div className={`sbadge ${status}`}>
                    <div className="sdot" />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                </div>

                <AgentSparkline health={health} status={status} />

                <div className="agent-metrics">
                  <div className="metric">
                    <div className="metric-val" style={{ color: health > 80 ? 'var(--cyan)' : health > 50 ? 'var(--orange)' : 'var(--red)' }}>
                      {health}%
                    </div>
                    <div className="metric-lbl">Health</div>
                  </div>
                  <div className="metric">
                    <div className="metric-val">{agent.total_tasks || 0}</div>
                    <div className="metric-lbl">Tasks</div>
                  </div>
                  <div className="metric">
                    <div className="metric-val">${agent.base_cost || 0}</div>
                    <div className="metric-lbl">Cost</div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAgents.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 60,
              color: 'var(--t3)',
              fontSize: 13,
              fontFamily: 'var(--mono)',
              letterSpacing: 2
            }}>
              NO_AGENTS_FOUND
            </div>
          )}
        </div>

        {/* Sidepanel */}
        {selectedAgentId && (
          <div className="chart-card" style={{ height: 'fit-content' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              📋 Agent History: {agents.find(a => a.agent_id === selectedAgentId)?.name}
            </div>
            <OptimizationHistory agentId={selectedAgentId} />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => setSelectedAgentId(null)}>Close</button>
              <button className="btn btn-danger" style={{ fontSize: 11 }} onClick={() => deleteAgent(selectedAgentId)}>⊗ Terminate</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
