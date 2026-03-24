'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Trash2, Activity, Terminal as TerminalIcon, Save, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

interface Node {
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
  const [nodes, setNodes] = useState<Node[]>([]);
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
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <select 
          className="fi" 
          style={{ width: '220px' }}
          value={selectedWfName}
          onChange={(e) => loadWorkflow(e.target.value)}
        >
          {workflows.map(wf => <option key={wf.id} value={wf.name}>{wf.name}</option>)}
          {!workflows.find(w => w.name === 'Market Research Pipeline') && <option value="Market Research Pipeline">Market Research Pipeline</option>}
        </select>
        <button className="ms-btn ms-btn-g ms-btn-sm" onClick={() => {
          const name = prompt('Workflow Name?');
          if (name) setSelectedWfName(name);
        }}><Plus size={14} /> New</button>
        <button className="ms-btn ms-btn-b ms-btn-sm" onClick={saveWorkflow}><Save size={14} /> Save</button>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="ms-btn ms-btn-g ms-btn-sm" onClick={() => {
             const nid = `n${nodes.length + 1}`;
             setNodes([...nodes, { nid, name: 'New Step', agent: 'Orchestrator', prompt: 'Task details here', x: 100, y: 100, status: 'idle' }]);
          }}><Plus size={14} /> Add Step</button>
          <button className="ms-btn ms-btn-p ms-btn-sm"><Play size={14} /> Run Workflow</button>
        </div>
      </div>

      <div className="ms-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
        <div className="ms-card-hd">
          <div className="ms-card-title" style={{ display: 'flex', gap: '16px' }}>
            <span>NODES: <span className="text-a">{nodes.length}</span></span>
            <div style={{ width: 1, height: 14, background: 'var(--s-border)' }}></div>
            <span>STATUS: <span className="text-g">Ready</span></span>
          </div>
          <div className="ms-pill">
             <Activity size={12} className="ms-dot-pulse text-g" />
             Last sync: Just now
          </div>
        </div>
        
        <div 
          className="ms-wf-canvas" 
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={canvasRef}
        >
          <div className="ms-wf-grid"></div>
          
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--s-border2)" />
              </marker>
            </defs>
            {renderEdges()}
          </svg>
          
          <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}>
            {nodes.map(node => (
              <div 
                key={node.nid}
                className={`ms-node ${isDragging === node.nid ? 'act' : ''}`}
                style={{ left: node.x, top: node.y }}
                onMouseDown={(e) => handleMouseDown(node.nid, e)}
              >
                <div className="ms-node-title">
                  <div className={`ms-dot ms-dot-${node.status === 'completed' ? 'g' : node.status === 'running' ? 'b' : 'y'}`}></div>
                  {node.name}
                </div>
                <div className="ms-node-sub">{node.agent}</div>
                <div style={{ fontSize: '11px', color: 'var(--s-t2)', marginTop: '8px', lineHeight: '1.4' }}>
                  {node.prompt}
                </div>
                
                {/* Ports */}
                <div className="ms-port" style={{ position: 'absolute', left: '-8px', top: 'calc(50% - 7px)' }}></div>
                <div className="ms-port" style={{ position: 'absolute', right: '-8px', top: 'calc(50% - 7px)' }}></div>
                
                <button 
                  style={{ position: 'absolute', top: 4, right: 4, background: 'transparent', border: 'none', color: 'var(--s-t4)', cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter(n => n.nid !== node.nid)); }}
                ><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ms-card" style={{ marginTop: '20px' }}>
        <div className="ms-card-hd">
          <div className="ms-card-title">Execution Log</div>
          <div className="ms-pill" style={{ color: 'var(--s-blue)' }}>
            <TerminalIcon size={12} /> axon.relay
          </div>
        </div>
        <div className="ms-card-body" style={{ padding: '0' }}>
          <div className="ms-stream" style={{ height: '120px', border: 'none' }}>
            <div className="info">[14:32:01] Initializing {selectedWfName}...</div>
            <div className="ok">[14:32:05] Workflow loaded from database.</div>
            <div className="info">[14:32:06] Monitoring active nodes...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
