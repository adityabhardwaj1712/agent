"use client";

import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: 'start', position: { x: 250, y: 50 }, data: { label: 'Goal: Web Research' }, style: { background: '#09090b', color: '#fff', border: '1px solid #334155' } },
  { id: 'agent1', position: { x: 100, y: 200 }, data: { label: 'Web Researcher (Gemma 3 4B)' }, style: { background: '#10B981', color: '#fff', border: 'none' } },
  { id: 'agent2', position: { x: 400, y: 200 }, data: { label: 'Data Analyst (Gemma 3n 2B)' }, style: { background: '#8B5CF6', color: '#fff', border: 'none' } },
  { id: 'end', position: { x: 250, y: 400 }, data: { label: 'Aggregated Report' }, style: { background: '#09090b', color: '#fff', border: '1px solid #334155' } },
];

const initialEdges = [
  { id: 'e1', source: 'start', target: 'agent1', animated: true, style: { stroke: '#3B82F6' } },
  { id: 'e2', source: 'start', target: 'agent2', animated: true, style: { stroke: '#3B82F6' } },
  { id: 'e3', source: 'agent1', target: 'end', style: { stroke: '#64748B' } },
  { id: 'e4', source: 'agent2', target: 'end', style: { stroke: '#64748B' } },
];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)), [setEdges]);

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '12px', background: '#09090b', overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls style={{ fill: '#white', color: 'black' }} />
        <MiniMap nodeStrokeColor={() => '#334155'} nodeColor={(n: any) => n.style?.background as string || '#fff'} />
        <Background color="#334155" gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
