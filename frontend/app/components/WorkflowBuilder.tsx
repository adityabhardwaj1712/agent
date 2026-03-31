'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  Activity, 
  Save, 
  RefreshCw,
  Cpu,
  ArrowRight,
  Database,
  Layers,
  Search,
  Settings2,
  Terminal as TerminalIcon
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

interface WFNode {
  nid: string;
  name: string;
  agent: string;
  prompt: string;
  x: number;
  y: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

interface Edge {
  from: string;
  to: string;
}

const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState<WFNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWfName, setSelectedWfName] = useState<string>('Market Research Pipeline');
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const fetchWorkflows = async () => {
    try {
      const data = await apiFetch<any[]>('/workflows');
      setWorkflows(data || []);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    }
  };

  const loadWorkflow = async (name: string) => {
    try {
      const data = await apiFetch<any>(`/workflows/${name}`);
      setNodes(data.definition.nodes || []);
      setEdges(data.definition.edges || []);
      setSelectedWfName(name);
      toast(`Protocol Loaded: ${name}`, 'ok');
    } catch (err) {
      toast(`Failed to load protocol: ${name}`, 'err');
    }
  };

  const executeWorkflow = async () => {
    try {
      const data = await apiFetch<any>(`/workflows/${selectedWfName}/run`, { method: 'POST' });
      toast('Neural Protocol Executed: Node progression started.', 'ok');
    } catch (err) {
      toast('Execution Failed', 'err');
    }
  };

  const saveWorkflow = async () => {
    try {
      await apiFetch('/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: selectedWfName,
          description: 'Autonomous Intelligence Flow',
          definition: { nodes, edges }
        })
      });
      toast(`Protocol Synchronized`, 'ok');
      fetchWorkflows();
    } catch (err) {
      toast('Sync Failed', 'err');
    }
  };

  useEffect(() => {
    fetchWorkflows();
    loadWorkflow(selectedWfName);
  }, []);

  const handleMouseDown = (nid: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.ms-btn')) return;
    setIsDragging(nid);
    const node = nodes.find(n => n.nid === nid);
    if (node) {
      setDragOffset({
        x: e.clientX - node.x,
        y: e.clientY - node.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setNodes(prev => prev.map(n => 
        n.nid === isDragging 
          ? { ...n, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
          : n
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  return (
    <div className="ms-content" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Control Bar */}
      <div className="ms-glass-panel" style={{ padding: '12px 20px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--blue)', fontWeight: 700, marginBottom: '2px' }}>Orchestration Target</span>
          <select 
            className="fi" 
            style={{ width: '320px', background: 'transparent', border: '1px solid var(--bg3)', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontWeight: 600 }}
            value={selectedWfName}
            onChange={(e) => loadWorkflow(e.target.value)}
          >
            {workflows.map(wf => <option key={wf.id} value={wf.name}>{wf.name}</option>)}
            {!workflows.find(w => w.name === 'Market Research Pipeline') && <option value="Market Research Pipeline">Market Research Pipeline</option>}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
          <button className="ms-btn ms-btn-sm" onClick={saveWorkflow} style={{ background: 'var(--bg2)', borderColor: 'var(--bg3)' }}>
            <Save size={14} className="mr-2" /> Sync State
          </button>
          <button 
            className="ms-btn ms-btn-p ms-btn-sm" 
            style={{ padding: '0 24px', fontWeight: 700, letterSpacing: '0.5px' }}
            onClick={executeWorkflow}
          >
            <Play size={14} className="mr-2 fill-current" /> EXECUTE PROTOCOL
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Workspace */}
        <div className="ms-glass-panel" style={{ position: 'relative', padding: 0, overflow: 'hidden', background: 'rgba(5, 5, 8, 0.4)' }}>
          <div className="ms-card-hd" style={{ padding: '12px 20px', borderBottom: '1px solid var(--bg3)' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--t3)' }}>ACTIVE_NODES: <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{nodes.length}</span></div>
              <div style={{ fontSize: '11px', color: 'var(--t3)' }}>RELATIONS: <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{edges.length}</span></div>
            </div>
            <div className="ms-badge ms-b-g" style={{ fontSize: '9px', fontWeight: 800 }}>
              GRID_STABLE
            </div>
          </div>

          <div 
            className="ms-wf-canvas" 
            ref={canvasRef}
            style={{ 
              background: 'var(--bg0)', 
              backgroundImage: 'radial-gradient(var(--bg2) 1px, transparent 0)', 
              backgroundSize: '40px 40px',
              height: '100%',
              position: 'relative'
            }}
          >
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <defs>
                <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="var(--blue)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--blue)" stopOpacity="0.2" />
                </linearGradient>
                <filter id="neonGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {edges.map((edge, i) => {
                const fromNode = nodes.find(n => n.nid === edge.from);
                const toNode = nodes.find(n => n.nid === edge.to);
                if (!fromNode || !toNode) return null;

                const x1 = fromNode.x + 220; 
                const y1 = fromNode.y + 40;  
                const x2 = toNode.x;
                const y2 = toNode.y + 40;
                const mx = (x1 + x2) / 2;

                return (
                  <g key={i}>
                    <path 
                      d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                      fill="none"
                      stroke="url(#edgeGradient)"
                      strokeWidth="2"
                      className="ms-wf-edge-pulse"
                      filter="url(#neonGlow)"
                    />
                    <circle cx={x2} cy={y2} r="3" fill="var(--blue)" />
                  </g>
                );
              })}
            </svg>
            
            <div>
              {nodes.map(node => (
                <div 
                  key={node.nid}
                  className={`ms-node-card ${isDragging === node.nid ? 'dragging' : ''}`}
                  style={{ 
                    left: node.x, 
                    top: node.y, 
                    width: 220, 
                    position: 'absolute',
                    zIndex: isDragging === node.nid ? 100 : 2
                  }}
                  onMouseDown={(e) => handleMouseDown(node.nid, e)}
                >
                  <div className="ms-node-header">
                    <div className={`ms-status-dot ${node.status}`}></div>
                    <span className="ms-node-name">{node.name}</span>
                    <button 
                      className="ms-icon-btn red ml-auto"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setNodes(nodes.filter(n => n.nid !== node.nid)); }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <div className="ms-node-body">
                    <div className="ms-agent-tag"><Cpu size={10} className="mr-1" /> {node.agent}</div>
                    <p className="ms-node-prompt">“{node.prompt}”</p>
                  </div>

                  {/* IO Ports */}
                  <div className="ms-node-port port-in"></div>
                  <div className="ms-node-port port-out"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intelligence Palette */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* AI Copilot */}
          <div className="ms-glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <TerminalIcon size={18} style={{ color: 'var(--yellow)' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>AI COPILOT</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                className="fi" 
                placeholder="e.g. Deploy an app and monitor errors..." 
                style={{ width: '100%', paddingRight: '40px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value;
                    if (!val) return;
                    e.currentTarget.value = 'Generating workflow...';
                    e.currentTarget.disabled = true;
                    try {
                      const res = await apiFetch<any>('/copilot/generate-workflow', {
                        method: 'POST',
                        body: JSON.stringify({ prompt: val })
                      });
                      setSelectedWfName(res.name);
                      setNodes(res.definition.nodes || []);
                      setEdges(res.definition.edges || []);
                      e.currentTarget.value = '';
                    } catch (err) {
                      toast('Failed to generate workflow. Try again.', 'err');
                      e.currentTarget.value = val;
                    } finally {
                      e.currentTarget.disabled = false;
                    }
                  }
                }}
              />
              <ArrowRight size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
            </div>
            <div style={{ fontSize: '9px', color: 'var(--t3)', marginTop: '8px', letterSpacing: '0.5px' }}>PRESS ENTER TO AUTO-BUILD FLOW</div>
          </div>

          <div className="ms-glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Layers size={18} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>NODE LIBRARY</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="ms-btn-ghost active" onClick={() => {
                const nid = `n${Date.now()}`;
                setNodes([...nodes, { nid, name: 'Neural Instance', agent: 'Orchestrator', prompt: 'Define neural weights...', x: 50, y: 50, status: 'idle' }]);
              }}>
                <Plus size={14} className="mr-3" /> New Neural Node
              </button>
              <button className="ms-btn-ghost">
                <Search size={14} className="mr-3" /> Template Registry
              </button>
              <button className="ms-btn-ghost">
                <Settings2 size={14} className="mr-3" /> Logic Config
              </button>
            </div>
          </div>

          <div className="ms-glass-panel" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="ms-card-hd" style={{ padding: '12px 20px', borderBottom: '1px solid var(--bg3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TerminalIcon size={14} />
                <span style={{ fontSize: '11px', fontWeight: 800 }}>TELEMETRY_STREAM</span>
              </div>
              <Activity size={12} className="ms-dot-pulse" style={{ color: 'var(--blue)' }} />
            </div>
            
            <div className="ms-log-container">
              <div className="log-line info">[SYS] INITIALIZING CORE_OS...</div>
              <div className="log-line ok">[OK] NEURAL_LINK ESTABLISHED</div>
              <div className="log-line ok">[OK] REDIS_PUBSUB: ACTIVE</div>
              <div className="log-line info">[WF] LOADED: {selectedWfName}</div>
              <div className="log-line debug">Waiting for protocol trigger...</div>
              <div className="log-cursor">_</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ms-node-card {
          background: rgba(15, 15, 20, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid var(--bg3);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ms-node-card:hover {
          border-color: var(--blue);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }
        .ms-node-card.dragging {
          border-color: var(--blue);
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
        }
        .ms-node-header {
          padding: 8px 12px;
          border-bottom: 1px solid var(--bg3);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ms-node-name {
          font-size: 11px;
          font-weight: 700;
          color: var(--text);
          text-transform: uppercase;
        }
        .ms-node-body {
          padding: 12px;
        }
        .ms-node-prompt {
          font-size: 10.5px;
          color: var(--t2);
          line-height: 1.5;
          margin-top: 8px;
          font-style: italic;
        }
        .ms-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .ms-status-dot.idle { background: var(--t3); }
        .ms-status-dot.running { background: var(--blue); box-shadow: 0 0 8px var(--blue); }
        .ms-status-dot.completed { background: var(--green); }
        
        .ms-agent-tag {
          font-size: 9px;
          font-family: var(--mono);
          color: var(--blue);
          background: rgba(59, 130, 246, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }
        
        .ms-node-port {
          width: 8px;
          height: 8px;
          background: var(--bg2);
          border: 1px solid var(--bg3);
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 1px;
        }
        .port-in { left: -4px; }
        .port-out { right: -4px; border-radius: 50%; }

        .ms-btn-ghost {
          background: transparent;
          border: 1px solid transparent;
          color: var(--t2);
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        .ms-btn-ghost:hover {
          background: var(--bg2);
          color: var(--text);
        }
        .ms-btn-ghost.active {
          border-color: var(--bg3);
          background: rgba(255,255,255,0.03);
          color: var(--blue);
        }

        .ms-log-container {
          flex: 1;
          padding: 16px;
          font-family: var(--mono);
          font-size: 10px;
          line-height: 1.8;
          overflow-y: auto;
        }
        .log-line { border-left: 2px solid transparent; padding-left: 8px; }
        .log-line.info { color: var(--t3); }
        .log-line.ok { color: var(--green); border-left-color: var(--green); }
        .log-line.debug { color: var(--blue); }
        .log-cursor { display: inline-block; width: 6px; height: 12px; background: var(--blue); animation: blink 1s infinite; margin-left: 4px; vertical-align: middle; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default WorkflowBuilder;
