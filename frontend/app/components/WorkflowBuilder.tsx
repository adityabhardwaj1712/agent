'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Trash2, Activity, Terminal as TerminalIcon } from 'lucide-react';

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
  const [nodes, setNodes] = useState<Node[]>([
    { nid: 'n1', name: 'Gather Data', agent: 'WebResearcher', prompt: 'Search for market trends', x: 60, y: 60, status: 'idle' },
    { nid: 'n2', name: 'Analyze Results', agent: 'DataAnalyst', prompt: 'Analyze the gathered data', x: 280, y: 60, status: 'idle' },
    { nid: 'n3', name: 'Write Report', agent: 'ContentWriter', prompt: 'Write a concise market report', x: 500, y: 60, status: 'idle' },
  ]);
  const [edges, setEdges] = useState<Edge[]>([
    { from: 'n1', to: 'n2' },
    { from: 'n2', to: 'n3' },
  ]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (nid: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('port')) return;
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
      const y1 = fromNode.y + 50;  // Center Y
      const x2 = toNode.x;
      const y2 = toNode.y + 50;

      const mx = (x1 + x2) / 2;

      return (
        <path 
          key={i}
          d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
          fill="none"
          stroke="var(--border2)"
          strokeWidth="1.5"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  return (
    <div className="view-body">
      <div className="row gap-8">
        <select className="fs" style={{ width: '220px' }}>
          <option>Market Research Pipeline</option>
          <option>Code Review Pipeline</option>
        </select>
        <button className="btn btn-g btn-sm"><Plus size={14} /> New Workflow</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn btn-g btn-sm"><Plus size={14} /> Add Step</button>
          <button className="btn btn-p btn-sm"><Play size={14} /> Run Workflow</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="wf-toolbar">
          <span className="mono" style={{ fontSize: '11px', color: 'var(--t3)' }}>NODES: <span className="text-a">{nodes.length}</span></span>
          <div className="wf-toolbar-sep"></div>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--t3)' }}>STATUS: <span className="text-g">Ready</span></span>
          <div className="wf-toolbar-sep"></div>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--t3)' }}>LAST RUN: 2m ago</span>
        </div>
        
        <div 
          className="workflow-canvas" 
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={canvasRef}
        >
          <svg className="wf-svg">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--border2)" />
              </marker>
            </defs>
            {renderEdges()}
          </svg>
          
          <div className="wf-canvas-inner">
            {nodes.map(node => (
              <div 
                key={node.nid}
                className={`wf-node ${isDragging === node.nid ? 'dragging' : ''}`}
                style={{ left: node.x, top: node.y }}
                onMouseDown={(e) => handleMouseDown(node.nid, e)}
              >
                <div className="wf-node-title">
                  <span className={`wf-node-status ${node.status}`} style={{ background: `var(--${node.status === 'completed' ? 'g' : node.status === 'running' ? 'a' : 't3'})` }}></span>
                  {node.name}
                </div>
                <div className="wf-node-agent mono">{node.agent}</div>
                <div className="wf-node-prompt">{node.prompt}</div>
                <div className="wf-node-ports">
                  <div className="port in"></div>
                  <div className="port out"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="wf-status-bar">
          <Activity size={12} className="text-g animate-pulse" />
          <span>System Idle — Awaiting workflow execution</span>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-hd-title">Execution Log</div>
          <button className="btn btn-xs btn-g">Clear</button>
        </div>
        <div className="card-body" style={{ padding: '12px' }}>
          <div className="wf-run-log">
            <div className="log-line info">[14:32:01] Initializing Market Research Pipeline...</div>
            <div className="log-line ok">[14:32:05] Step 1: Gather Data completed successfully.</div>
            <div className="log-line info">[14:32:06] Forwarding payload to DataAnalyst...</div>
            <div className="log-line ok">[14:32:18] Step 2: Analyze Results completed.</div>
            <div className="log-line ok">[14:32:22] Workflow execution finished.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
