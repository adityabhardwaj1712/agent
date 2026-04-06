'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════
   WORKFLOWS VIEW — Draggable Pipeline Builder
═══════════════════════════════════════════════════ */

interface WfNode {
  id: string;
  title: string;
  agent: string;
  x: number;
  y: number;
  status: 'completed' | 'running' | 'idle';
  color: string;
}

const INITIAL_NODES: WfNode[] = [
  { id: 'n1', title: 'Fetch', agent: 'Worker-12', x: 60, y: 100, status: 'completed', color: 'var(--green)' },
  { id: 'n2', title: 'Validate', agent: 'Worker-05', x: 230, y: 60, status: 'completed', color: 'var(--green)' },
  { id: 'n3', title: 'Transform', agent: 'Worker-31', x: 400, y: 100, status: 'running', color: 'var(--blue)' },
  { id: 'n4', title: 'Load', agent: 'Worker-08', x: 570, y: 60, status: 'idle', color: 'var(--t3)' },
  { id: 'n5', title: 'Index', agent: 'Core-A', x: 740, y: 100, status: 'idle', color: 'var(--t3)' },
];

const INITIAL_EDGES: [string, string][] = [['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4'], ['n4', 'n5']];

function WorkflowCanvas({ nodes, edges, onDragStart }: {
  nodes: WfNode[];
  edges: [string, string][];
  onDragStart: (e: React.MouseEvent, id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const parent = svg.parentElement;
    if (!parent) return;
    svg.setAttribute('width', String(parent.offsetWidth));
    svg.setAttribute('height', String(parent.offsetHeight));

    // Clear and redraw
    svg.innerHTML = '<defs><marker id="wfarrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#00b4f0" stroke-width="1.5"/></marker></defs>';

    edges.forEach(([a, b]) => {
      const na = nodes.find(n => n.id === a);
      const nb = nodes.find(n => n.id === b);
      if (!na || !nb) return;
      const x1 = na.x + 160, y1 = na.y + 25, x2 = nb.x, y2 = nb.y + 25;
      const mx = (x1 + x2) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(0,180,240,0.4)');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('marker-end', 'url(#wfarrow)');
      svg.appendChild(path);
    });
  }, [nodes, edges]);

  return (
    <div className="wf-canvas" style={{ minHeight: 300 }}>
      <svg className="wf-svg" ref={svgRef} />
      {nodes.map(n => (
        <div
          key={n.id}
          className="wf-node"
          style={{ left: n.x, top: n.y, borderColor: `${n.color}44` }}
          onMouseDown={(e) => onDragStart(e, n.id)}
        >
          <div style={{ float: 'right', width: 8, height: 8, borderRadius: '50%', background: n.color, marginTop: 2 }} />
          <div className="wf-node-title" style={{ color: n.color }}>{n.title}</div>
          <div className="wf-node-agent">{n.agent}</div>
        </div>
      ))}
    </div>
  );
}

export default function WorkflowsView() {
  const [nodes, setNodes] = useState<WfNode[]>(INITIAL_NODES);
  const [edges] = useState<[string, string][]>(INITIAL_EDGES);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const n = nodes.find(n => n.id === id);
    if (!n) return;
    dragRef.current = { id, offsetX: e.clientX - n.x, offsetY: e.clientY - n.y };
  }, [nodes]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { id, offsetX, offsetY } = dragRef.current;
      setNodes(prev => prev.map(n =>
        n.id === id ? { ...n, x: Math.max(0, e.clientX - offsetX), y: Math.max(0, e.clientY - offsetY) } : n
      ));
    };
    const onUp = () => {
      dragRef.current = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const runWorkflow = () => {
    setNodes(prev => prev.map(n => {
      if (n.id === 'n3') return { ...n, status: 'completed' as const, color: 'var(--green)' };
      if (n.id === 'n4') return { ...n, status: 'running' as const, color: 'var(--blue)' };
      return n;
    }));
  };

  const addNode = () => {
    const id = 'n' + Date.now();
    setNodes(prev => [...prev, {
      id, title: 'New Step',
      agent: `Worker-${Math.floor(Math.random() * 30 + 1)}`,
      x: 200 + Math.random() * 200, y: 200,
      status: 'idle' as const, color: 'var(--t3)',
    }]);
  };

  return (
    <div className="view-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="pg-title">Workflows</h1>
          <div className="pg-sub">Orchestrated multi-step agent pipelines</div>
        </div>
        <button className="btn btn-primary btn-sm">+ New Workflow</button>
      </div>

      {/* Pipeline 1 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Data Ingestion Pipeline</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>1,247 runs · Last: 2m ago · Avg: 3m 12s</div>
          </div>
          <span className="pill pill-green">active</span>
        </div>
        <div className="wf-toolbar">
          <button className="btn btn-primary btn-sm" onClick={runWorkflow}>▷ Run</button>
          <button className="btn btn-ghost btn-sm">💾 Save</button>
          <button className="btn btn-ghost btn-sm" onClick={addNode}>+ Add Node</button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>Drag nodes to rearrange</span>
        </div>
        <WorkflowCanvas nodes={nodes} edges={edges} onDragStart={handleDragStart} />
      </div>

      {/* Pipeline 2 (static) */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Health Check Automation</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>8,934 runs · Last: 30s ago · Avg: 8s</div>
          </div>
          <span className="pill pill-green">active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {['Ping', 'Metrics', 'Report'].map((s, i) => (
            <React.Fragment key={s}>
              <span className="pill pill-green" style={{ borderRadius: 6 }}>{s}</span>
              {i < 2 && <span style={{ color: 'var(--t3)', margin: '0 8px', fontSize: 14 }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
