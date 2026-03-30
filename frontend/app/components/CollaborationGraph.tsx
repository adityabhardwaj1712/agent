'use client';
import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

export default function CollaborationGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const messages = await apiFetch<any[]>('/protocol/messages?limit=100');
      if (!messages) return;

      const nodeMap: Record<string, Node> = {};
      const edgeList: Edge[] = [];

      messages.forEach(m => {
        if (!nodeMap[m.from_agent_id]) {
          nodeMap[m.from_agent_id] = { id: m.from_agent_id, name: 'Agent_' + m.from_agent_id.substring(0,4), x: Math.random() * 800, y: Math.random() * 500, vx: 0, vy: 0 };
        }
        if (!nodeMap[m.to_agent_id]) {
          nodeMap[m.to_agent_id] = { id: m.to_agent_id, name: 'Agent_' + m.to_agent_id.substring(0,4), x: Math.random() * 800, y: Math.random() * 500, vx: 0, vy: 0 };
        }
        edgeList.push({ source: m.from_agent_id, target: m.to_agent_id, type: m.message_type });
      });

      setNodes(Object.values(nodeMap));
      setEdges(edgeList);
    } catch (e) {
      console.error('Failed to fetch protocol data', e);
    }
  };

  useEffect(() => {
    const animate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(n => ({ ...n }));
        
        // 1. Repulsion (between all nodes)
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[i].x - newNodes[j].x;
            const dy = newNodes[i].y - newNodes[j].y;
            const distSq = dx * dx + dy * dy || 1;
            const force = 5000 / distSq;
            const fx = (dx / Math.sqrt(distSq)) * force;
            const fy = (dy / Math.sqrt(distSq)) * force;
            newNodes[i].vx += fx;
            newNodes[i].vy += fy;
            newNodes[j].vx -= fx;
            newNodes[j].vy -= fy;
          }
        }

        // 2. Attraction (along edges)
        edges.forEach(e => {
          const s = newNodes.find(n => n.id === e.source);
          const t = newNodes.find(n => n.id === e.target);
          if (s && t) {
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 150) * 0.05;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            s.vx += fx; s.vy += fy;
            t.vx -= fx; t.vy -= fy;
          }
        });

        // 3. Central Gravity & Friction
        const centerX = canvasRef.current?.offsetWidth ? canvasRef.current.offsetWidth / 2 : 400;
        const centerY = canvasRef.current?.offsetHeight ? canvasRef.current.offsetHeight / 2 : 300;
        
        return newNodes.map(n => {
          const gx = (centerX - n.x) * 0.01;
          const gy = (centerY - n.y) * 0.01;
          n.vx = (n.vx + gx) * 0.9;
          n.vy = (n.vy + gy) * 0.9;
          n.x += n.vx;
          n.y += n.vy;
          return n;
        });
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => { if(requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [edges.length]);

  return (
    <div ref={canvasRef} className="ms-wf-canvas" style={{ minHeight: 600 }}>
       <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
             <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                   <feMergeNode in="coloredBlur" />
                   <feMergeNode in="SourceGraphic" />
                </feMerge>
             </filter>
          </defs>
          
          {/* Edges */}
          {edges.map((e, i) => {
             const s = nodes.find(n => n.id === e.source);
             const t = nodes.find(n => n.id === e.target);
             if (!s || !t) return null;
             return (
                <line 
                   key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} 
                   stroke="var(--blue)" strokeWidth="1.5" strokeOpacity="0.2" 
                />
             );
          })}

          {/* Nodes */}
          {nodes.map(n => (
             <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                <circle r="22" fill="var(--bg2)" stroke="var(--blue)" strokeWidth="2" filter="url(#glow)" />
                <text 
                   dy=".3em" textAnchor="middle" fill="var(--text)" 
                   style={{ fontSize: 9, fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}
                >
                   {n.name}
                </text>
                <circle r="4" fill="var(--green)" cx="15" cy="-15" className="ms-dot-pulse" />
             </g>
          ))}
       </svg>
    </div>
  );
}
