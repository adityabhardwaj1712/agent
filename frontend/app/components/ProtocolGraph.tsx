"use client";
import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

interface ProtocolGraphProps {
  events: any[];
}

export default function ProtocolGraph({ events }: ProtocolGraphProps) {
  // Extract unique agents and tasks from events to build a simple graph
  const nodes: Node[] = useMemo(() => {
    const agentNodes: Node[] = [];
    const taskNodes: Node[] = [];
    const seenAgents = new Set<string>();
    const seenTasks = new Set<string>();

    events.slice(0, 5).forEach((event, index) => {
      const agentId = event.agent_id || "System";
      const taskId = event.task_id || "Global";

      if (!seenAgents.has(agentId)) {
        agentNodes.push({
          id: `agent-${agentId}`,
          data: { label: `Agent: ${agentId.slice(0, 8)}` },
          position: { x: 50, y: index * 100 + 50 },
          style: { background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px' }
        });
        seenAgents.add(agentId);
      }

      if (!seenTasks.has(taskId)) {
        taskNodes.push({
          id: `task-${taskId}`,
          data: { label: `Task: ${event.event_type}` },
          position: { x: 300, y: index * 100 + 50 },
          style: { background: '#0f172a', color: '#38bdf8', border: '1px solid #0ea5e9', borderRadius: '8px' }
        });
        seenTasks.add(taskId);
      }
    });

    return [...agentNodes, ...taskNodes];
  }, [events]);

  const edges: Edge[] = useMemo(() => {
    const graphEdges: Edge[] = [];
    events.slice(0, 5).forEach((event) => {
      const agentId = event.agent_id || "System";
      const taskId = event.task_id || "Global";
      
      graphEdges.push({
        id: `e-${agentId}-${taskId}`,
        source: `agent-${agentId}`,
        target: `task-${taskId}`,
        animated: true,
        style: { stroke: '#38bdf8' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' }
      });
    });
    return graphEdges;
  }, [events]);

  return (
    <div style={{ height: '300px', width: '100%', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#334155" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
