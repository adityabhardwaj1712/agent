"use client";

import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

interface Node {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface Edge {
  source: string;
  target: string;
}

interface WorkflowGraphProps {
  nodes: Node[];
  edges: Edge[];
}

const WorkflowGraph: React.FC<WorkflowGraphProps> = ({ nodes, edges }) => {
  // Simple layout logic: Rank nodes by depth
  const layout = useMemo(() => {
    const depths: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => {
      depths[n.id] = 0;
      adj[n.id] = [];
    });

    edges.forEach(e => {
      adj[e.source].push(e.target);
    });

    // BFS to find depths
    const queue = nodes.filter(n => !edges.find(e => e.target === n.id)).map(n => n.id);
    const visited = new Set(queue);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      adj[curr].forEach(next => {
        depths[next] = Math.max(depths[next], depths[curr] + 1);
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      });
    }

    // Group nodes by depth for layers
    const layers: string[][] = [];
    Object.entries(depths).forEach(([id, d]) => {
      if (!layers[d]) layers[d] = [];
      layers[d].push(id);
    });

    return layers;
  }, [nodes, edges]);

  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 80;
  const HGAP = 100;
  const VGAP = 40;

  const nodePositions: Record<string, { x: number; y: number }> = {};
  layout.forEach((layer, lIdx) => {
    const layerHeight = layer.length * (NODE_HEIGHT + VGAP) - VGAP;
    layer.forEach((nodeId, nIdx) => {
      nodePositions[nodeId] = {
        x: lIdx * (NODE_WIDTH + HGAP) + 20,
        y: nIdx * (NODE_HEIGHT + VGAP) + 40 + (layout[0].length * (NODE_HEIGHT + VGAP) / 2 - layerHeight / 2)
      };
    });
  });

  return (
    <div className="w-full h-[400px] overflow-auto bg-black/20 rounded-xl border border-white/10 relative p-4 custom-scrollbar">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.2)" />
          </marker>
        </defs>
        {edges.map((edge, i) => {
          const start = nodePositions[edge.source];
          const end = nodePositions[edge.target];
          if (!start || !end) return null;
          return (
            <line
              key={i}
              x1={start.x + NODE_WIDTH}
              y1={start.y + NODE_HEIGHT / 2}
              x2={end.x}
              y2={end.y + NODE_HEIGHT / 2}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
      </svg>

      {nodes.map(node => {
        const pos = nodePositions[node.id];
        const colors = {
          completed: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
          running: 'border-blue-500/50 bg-blue-500/10 text-blue-400 animate-pulse',
          failed: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
          pending: 'border-white/10 bg-white/5 text-white/40'
        };

        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: NODE_WIDTH,
              height: NODE_HEIGHT
            }}
            className={`flex flex-col p-3 rounded-lg border backdrop-blur-md transition-all duration-500 ${colors[node.status]}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {node.status === 'completed' && <CheckCircle2 size={14} />}
              {node.status === 'running' && <Clock size={14} className="animate-spin" />}
              {node.status === 'failed' && <AlertCircle size={14} />}
              {node.status === 'pending' && <Circle size={14} />}
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                {node.id}
              </span>
            </div>
            <p className="text-[11px] leading-tight line-clamp-2 opacity-90">
              {node.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default WorkflowGraph;
