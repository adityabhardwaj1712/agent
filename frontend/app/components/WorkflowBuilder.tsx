'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Trash2, Activity, Terminal as TerminalIcon, Save, RefreshCw } from 'lucide-react';
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
      setWorkflows(data);
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
      toast(`Loaded ${name}`, 'ok');
    } catch (err) {
      // If not found, use default or empty
      if (name === 'Market Research Pipeline' && nodes.length === 0) {
        setNodes([
          { nid: 'n1', name: 'Gather Data', agent: 'WebResearcher', prompt: 'Search for market trends', x: 60, y: 100, status: 'idle' },
          { nid: 'n2', name: 'Analyze Results', agent: 'DataAnalyst', prompt: 'Analyze the gathered data', x: 300, y: 100, status: 'idle' },
          { nid: 'n3', name: 'Write Report', agent: 'ContentWriter', prompt: 'Write a concise market report', x: 540, y: 100, status: 'idle' },
        ]);
        setEdges([
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3' },
        ]);
      }
    }
  };

  const saveWorkflow = async () => {
    try {
      await apiFetch('/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: selectedWfName,
          description: 'Custom Workflow',
          definition: { nodes, edges }
        })
      });
      toast(`Saved ${selectedWfName}`, 'ok');
      fetchWorkflows();
    } catch (err) {
      toast('Failed to save workflow', 'err');
    }
  };

  useEffect(() => {
    fetchWorkflows();
    loadWorkflow(selectedWfName);
  }, []);

  const handleMouseDown = (nid: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('ms-port')) return;
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

  const renderEdges = () => {
    return edges.map((edge, i) => {
      const fromNode = nodes.find(n => n.nid === edge.from);
      const toNode = nodes.find(n => n.nid === edge.to);
      if (!fromNode || !toNode) return null;

      const x1 = fromNode.x + 180; // Node width
      const y1 = fromNode.y + 40;  // Center Y
      const x2 = toNode.x;
      const y2 = toNode.y + 40;

      const mx = (x1 + x2) / 2;

      return (
        <path 
          key={i}
          d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
          fill="none"
          stroke="var(--s-border2)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  return (
    <div className="ms-content">
      {/* Workflow Header */}
      <div className="ms-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '10px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Active Sequence</label>
          <select 
            className="fi" 
            style={{ width: '280px', fontWeight: 600 }}
            value={selectedWfName}
            onChange={(e) => loadWorkflow(e.target.value)}
          >
            {workflows.map(wf => <option key={wf.id} value={wf.name}>{wf.name}</option>)}
            {!workflows.find(w => w.name === 'Market Research Pipeline') && <option value="Market Research Pipeline">Market Research Pipeline</option>}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button className="ms-btn ms-btn-g ms-btn-sm" onClick={() => {
            const name = prompt('Workflow Name?');
            if (name) setSelectedWfName(name);
          }}><Plus size={14} /> Initialize New</button>
          <button className="ms-btn ms-btn-b ms-btn-sm" onClick={saveWorkflow}><Save size={14} /> Commit Changes</button>
          <div style={{ width: 1, height: 32, background: 'var(--bg3)', margin: '0 8px' }}></div>
          <button className="ms-btn ms-btn-p ms-btn-sm" style={{ padding: '0 24px' }}>
            <Play size={14} style={{ marginRight: 8 }} /> Execute Protocol
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Main Canvas */}
        <div className="ms-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', position: 'relative' }}>
          <div className="ms-card-hd" style={{ padding: '12px 20px', borderBottom: '1px solid var(--bg3)' }}>
            <div className="ms-card-title" style={{ display: 'flex', gap: '20px' }}>
              <span style={{ fontSize: '12px' }}>NODES: <span style={{ color: 'var(--cyan)' }}>{nodes.length}</span></span>
              <span style={{ fontSize: '12px' }}>EDGES: <span style={{ color: 'var(--cyan)' }}>{edges.length}</span></span>
            </div>
            <div className="ms-badge ms-b-g">
               Link: Stable
            </div>
          </div>
          
          <div 
            className="ms-wf-canvas" 
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={canvasRef}
            style={{ background: 'var(--bg0)', backgroundImage: 'radial-gradient(circle, var(--bg2) 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          >
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="var(--blue)" fillOpacity="0.5" />
                </marker>
                <filter id="glow">
                   <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                   <feMerge>
                       <feMergeNode in="coloredBlur"/>
                       <feMergeNode in="SourceGraphic"/>
                   </feMerge>
                </filter>
              </defs>
              {edges.map((edge, i) => {
                const fromNode = nodes.find(n => n.nid === edge.from);
                const toNode = nodes.find(n => n.nid === edge.to);
                if (!fromNode || !toNode) return null;

                const x1 = fromNode.x + 200; 
                const y1 = fromNode.y + 45;  
                const x2 = toNode.x;
                const y2 = toNode.y + 45;
                const mx = (x1 + x2) / 2;

                return (
                  <path 
                    key={i}
                    d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                    fill="none"
                    stroke="var(--blue)"
                    strokeWidth="2"
                    strokeOpacity="0.3"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>
            
            <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}>
              {nodes.map(node => (
                <div 
                  key={node.nid}
                  className={`ms-node ${isDragging === node.nid ? 'act' : ''}`}
                  style={{ 
                    left: node.x, 
                    top: node.y, 
                    width: 200, 
                    position: 'absolute',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleMouseDown(node.nid, e)}
                >
                  <div className="ms-node-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className={`ms-dot ms-dot-${node.status === 'completed' ? 'g' : node.status === 'running' ? 'b' : 'y'}`}></div>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
                  </div>
                  <div className="ms-node-sub" style={{ color: 'var(--cyan)' }}>{node.agent}</div>
                  <div style={{ fontSize: '11px', color: 'var(--t2)', marginTop: '8px', lineHeight: '1.4', fontStyle: 'italic' }}>
                    "{node.prompt.slice(0, 50)}{node.prompt.length > 50 ? '...' : ''}"
                  </div>
                  
                  {/* Ports */}
                  <div className="ms-port" style={{ position: 'absolute', left: '-6px', top: '42px', border: '2px solid var(--bg3)' }}></div>
                  <div className="ms-port" style={{ position: 'absolute', right: '-6px', top: '42px', border: '2px solid var(--bg3)' }}></div>
                  
                  <button 
                    style={{ position: 'absolute', top: 4, right: 4, background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter(n => n.nid !== node.nid)); }}
                  ><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ms-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Sequencer Controls</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="ms-btn ms-btn-g ms-btn-sm" onClick={() => {
                const nid = `n${nodes.length + 1}`;
                setNodes([...nodes, { nid, name: 'New Intelligence', agent: 'Orchestrator', prompt: 'Define task requirements...', x: 50, y: 50, status: 'idle' }]);
              }}><Plus size={14} style={{ marginRight: 8 }} /> Add Neural Node</button>
              <button className="ms-btn ms-btn-sm" style={{ borderColor: 'var(--bg3)', background: 'var(--bg1)' }}>
                <RefreshCw size={14} style={{ marginRight: 8 }} /> Reset Topology
              </button>
            </div>
          </div>

          <div className="ms-card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="ms-card-hd" style={{ padding: '12px 16px', borderBottom: '1px solid var(--bg3)' }}>
              <div className="ms-card-title">Event Stream</div>
              <Activity size={12} className="ms-dot-pulse" style={{ color: 'var(--green)' }} />
            </div>
            <div className="ms-stream" style={{ flex: 1, padding: '12px', border: 'none', fontSize: '11px' }}>
              <div className="info">SYS: Initializing link...</div>
              <div className="ok">AUTH: Connection verified.</div>
              <div className="info">WF: Buffer state: IDLE.</div>
              <div style={{ color: 'var(--t3)', marginTop: 8 }}>Ready for protocol launch.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
