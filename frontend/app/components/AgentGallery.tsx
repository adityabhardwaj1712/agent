'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';
import OptimizationHistory from './OptimizationHistory';

// Sparkline drawing (Tactical)
function drawSparkline(canvas: HTMLCanvasElement, base: number, status: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.offsetWidth || 200, h = 36;
  canvas.width = w; canvas.height = h;

  const color = status === 'online' || status === 'active' ? '#00f2ff'
    : status === 'degraded' ? '#ff9d00' : '#ff0055';

  const pts: number[] = [];
  let v = base;
  for (let i = 0; i < 24; i++) {
    v = Math.max(5, Math.min(100, v + (Math.random() - 0.5) * 12));
    pts.push(v);
  }

  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, color + '33');
  g.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.moveTo(0, h - (pts[0] / 100) * h);
  pts.forEach((p, i) => ctx.lineTo((i / (pts.length - 1)) * w, h - (p / 100) * h));
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, h - (pts[0] / 100) * h);
  pts.forEach((p, i) => ctx.lineTo((i / (pts.length - 1)) * w, h - (p / 100) * h));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1; ctx.stroke();
}

function AgentSparkline({ health, status }: { health: number; status: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvasRef.current) drawSparkline(canvasRef.current, health, status); }, [health, status]);
  return <div className="spk-wrap"><canvas ref={canvasRef} className="spk" /></div>;
}

export default function AgentGallery() {
  const [agents, setAgents] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => { fetchAgents(); }, []);
  const fetchAgents = async () => {
    try {
      const data = await apiFetch<any[]>('/agents');
      setAgents(data || []);
    } catch (err: any) { toast(err.message, 'err'); }
    finally { setLoading(false); }
  };

  const calculateHealth = (agent: any) => {
    const successRate = agent.total_tasks > 0 ? (agent.successful_tasks / agent.total_tasks) * 100 : (agent.success_rate || 99);
    return Math.round(((agent.reputation_score || 98) * 0.4) + (successRate * 0.6));
  };

  const getAgentType = (agent: any) => {
    const r = (agent.role || '').toLowerCase();
    if (r.includes('core') || r.includes('orchestrat')) return 'STRATEGIC';
    if (r.includes('storage') || r.includes('data')) return 'INTEL';
    if (r.includes('ai') || r.includes('model')) return 'NEURAL';
    return 'TACTICAL';
  };

  const getTypeIcon = (t: string) => ({ STRATEGIC: '🛰️', TACTICAL: '🛡️', INTEL: '💾', NEURAL: '🧠' }[t] || '🤖');
  const getTypeColor = (t: string) => ({ STRATEGIC: '#00f2ff', TACTICAL: '#0088ff', INTEL: '#ff9d00', NEURAL: '#7000ff' }[t] || '#fff');

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div className="terminal-flicker" style={{ color:'var(--cyan)', letterSpacing:2, fontSize:11, fontFamily:'var(--mono)' }}>SYNCING_FLEET_ARRAY...</div>
    </div>
  );

  const filteredAgents = agents.filter(a => {
    const m = a.name.toLowerCase().includes(filter.toLowerCase()) || (a.role || '').toLowerCase().includes(filter.toLowerCase());
    return m && (typeFilter === 'All' || getAgentType(a) === typeFilter.toUpperCase());
  });

  return (
    <div className="view-enter" style={{ paddingBottom: 40 }}>
      {/* Tactical Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25 }}>
        <div>
          <div className="pg-breadcrumb">FLEET_ARRAY // <span>SECTOR_BETA</span></div>
          <h1 className="pg-title" style={{ color: 'var(--cyan)', textShadow: 'var(--glow)', fontSize: '26px' }}>AGENT_FLEET</h1>
          <div className="sys-status">
            <span style={{ fontFamily:'var(--mono)', fontSize:'10px', color:'var(--t2)' }}>
              {agents.length} NODES_ACTIVE // {new Set(agents.map(getAgentType)).size} CLASS_TYPES
            </span>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ background:'var(--cyan)', color:'#000' }} onClick={() => (window as any).openAddAgent?.()}>[ DEPLOY_NEW_UNIT ]</button>
      </div>

      {/* Filter Matrix */}
      <div style={{ display:'flex', gap:10, marginBottom:20, background:'var(--bg1)', padding:10, borderRadius:8, border:'1px solid var(--border)' }}>
        <div className="sb-search" style={{ margin:0, flex:1 }}>
          <span style={{ color:'var(--cyan)', opacity:0.5 }}>❯</span>
          <input type="text" placeholder="FILTER_BY_CALLSIGN..." value={filter} onChange={e => setFilter(e.target.value)} style={{ textTransform:'uppercase', fontSize:10 }} />
        </div>
        {['All', 'Strategic', 'Tactical', 'Intel', 'Neural'].map(type => (
          <button key={type} onClick={() => setTypeFilter(type)} className={`btn btn-ghost btn-sm ${typeFilter === type ? 'active' : ''}`} style={{ 
            fontSize:9, 
            borderColor: typeFilter === type ? 'var(--cyan)' : 'transparent',
            color: typeFilter === type ? 'var(--cyan)' : 'var(--t3)'
          }}>
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAgentId ? '1fr 360px' : '1fr', gap: 20 }}>
        <div className="agent-grid">
          {filteredAgents.map(agent => {
            const t = getAgentType(agent);
            const h = calculateHealth(agent);
            const s = (agent.status || 'online').toLowerCase();
            const isSel = selectedAgentId === agent.agent_id;

            return (
              <div key={agent.agent_id} className={`agent-card terminal-flicker ${isSel ? 'active' : ''}`} 
                   style={{ border: isSel ? '1px solid var(--cyan)' : '1px solid var(--border)', background: isSel ? 'rgba(0,242,255,0.03)' : 'var(--bg2)' }}
                   onClick={() => setSelectedAgentId(isSel ? null : agent.agent_id)}>
                <div className="agent-head">
                  <div style={{ width:36, height:36, borderRadius:6, background:getTypeColor(t)+'22', border:`1px solid ${getTypeColor(t)}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                    {getTypeIcon(t)}
                  </div>
                  <div style={{ flex:1, marginLeft:12 }}>
                    <div className="agent-name" style={{ fontSize:13, fontWeight:800, color:'var(--text)', textTransform:'uppercase' }}>{agent.name}</div>
                    <div className="agent-id">ID_{agent.agent_id?.slice(0,8).toUpperCase()}</div>
                  </div>
                  <div className={`sys-dot`} style={{ background: s==='online'?'var(--green)':s==='degraded'?'var(--orange)':'var(--red)', boxShadow:s==='online'?'0 0 8px var(--green)':'none' }} />
                </div>

                <AgentSparkline health={h} status={s} />

                <div className="agent-metrics">
                  <div className="agent-metric">
                    <div className="agent-metric-val" style={{ color: h>80?'var(--green)':h>50?'var(--orange)':'var(--red)' }}>{h}%</div>
                    <div className="agent-metric-lbl">INTEGRITY</div>
                  </div>
                  <div className="agent-metric">
                    <div className="agent-metric-val">{agent.total_tasks || 0}</div>
                    <div className="agent-metric-lbl">MISSIONS</div>
                  </div>
                  <div className="agent-metric">
                    <div className="agent-metric-val" style={{ color:'var(--t3)' }}>${agent.base_cost || 0}</div>
                    <div className="agent-metric-lbl">RESOURCES</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedAgentId && (
          <div className="card" style={{ height:'fit-content', border:'1px solid var(--cyan)', boxShadow:'var(--glow)' }}>
            <div className="card-hd">
              <div className="card-title" style={{ color:'var(--cyan)' }}>UNIT_DIAGNOSTICS // {agents.find(a => a.agent_id === selectedAgentId)?.name.toUpperCase()}</div>
            </div>
            <OptimizationHistory agentId={selectedAgentId} />
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setSelectedAgentId(null)}>[ CLOSE_LINK ]</button>
              <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('INITIATE_TERMINATION_SEQUENCE?')) { apiFetch(`/agents/${selectedAgentId}`, {method:'DELETE'}).then(()=> {toast('UNIT_DECOMISSIONED','ok'); fetchAgents(); setSelectedAgentId(null);}); } }}>
                [ TERMINATE ]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
