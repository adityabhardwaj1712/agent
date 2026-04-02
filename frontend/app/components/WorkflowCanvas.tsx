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
  Edge,
  Handle,
  Position,
  NodeProps,
  MarkerType
} from 'reactflow';
import { Bot, Wrench, GitBranch, Zap, Play, Save } from 'lucide-react';


// --- Custom Nodes ---

const AgentNode = ({ data }: NodeProps) => (
  <div className={`card terminal-flicker relative border-2 min-w-[220px] group ${data.status === 'running' ? 'shadow-[0_0_20px_var(--blue)]' : ''}`} 
       style={{ borderColor: 'var(--blue)', background: 'rgba(0, 136, 255, 0.05)' }}>
    <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ background: 'var(--blue)', border: '2px solid #000' }} />
    <div className="p-4">
       <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-var(--blue) border border-var(--blue)">
             <Bot size={20} color="var(--blue)" />
          </div>
          <div>
             <div className="text-[9px] font-black tracking-widest leading-none mb-1" style={{ color: 'var(--blue)', opacity: 0.6 }}>NEURAL_ORCHESTRATOR</div>
             <div className="text-[14px] font-extrabold tracking-tight text-white uppercase">{data.label}</div>
          </div>
       </div>
       <div className="flex items-center justify-between text-[10px] font-mono p-2 rounded bg-black/60 border border-white/5 mb-1">
          <span style={{ color: 'var(--t3)' }}>MODEL:</span>
          <span style={{ color: 'var(--cyan)' }}>{data.model || 'GEMMA_3_4B'}</span>
       </div>
       <div className="flex items-center justify-between text-[10px] font-mono p-2 rounded bg-black/60 border border-white/5">
          <span style={{ color: 'var(--t3)' }}>LATENCY:</span>
          <span style={{ color: 'var(--green)' }}>LOW_Z</span>
       </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ background: 'var(--blue)', border: '2px solid #000' }} />
  </div>
);

const ToolNode = ({ data }: NodeProps) => (
  <div className="card border-2 min-w-[180px]" style={{ borderColor: 'var(--orange)', background: 'rgba(255, 157, 0, 0.05)' }}>
    <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ background: 'var(--orange)', border: '2px solid #000' }} />
    <div className="p-3">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center border border-var(--orange)">
             <Wrench size={16} color="var(--orange)" />
          </div>
          <div className="text-[11px] font-black uppercase tracking-[2px] text-white/90">{data.label}</div>
       </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ background: 'var(--orange)', border: '2px solid #000' }} />
  </div>
);

const RouterNode = ({ data }: NodeProps) => (
  <div className="card rotate-45 w-20 h-20 flex items-center justify-center border-2" style={{ borderColor: 'var(--purple)', background: 'rgba(112, 0, 255, 0.05)' }}>
    <Handle type="target" position={Position.Top} className="!-top-1" style={{ background: 'var(--purple)', border: '2px solid #000' }} />
    <div className="-rotate-45 text-center flex flex-col items-center">
       <GitBranch size={20} color="var(--purple)" />
       <div className="text-[8px] font-black tracking-tighter text-white mt-1 pt-1 opacity-60">IX_GATE</div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!-bottom-1" style={{ background: 'var(--purple)', border: '2px solid #000' }} />
  </div>
);

const nodeTypes = {
  agentNode: AgentNode,
  toolNode: ToolNode,
  routerNode: RouterNode,
};

const initialNodes = [
  { 
    id: '1', 
    type: 'agentNode', 
    position: { x: 250, y: 50 }, 
    data: { label: 'STRATEGIST', model: 'LLAMA_3_70B', status: 'idle' } 
  },
  { 
    id: '2', 
    type: 'routerNode', 
    position: { x: 310, y: 220 }, 
    data: { label: 'DECISION_NODE', model: '', status: 'idle' } 
  },
  { 
    id: '3', 
    type: 'agentNode', 
    position: { x: 100, y: 380 }, 
    data: { label: 'RESEARCHER', model: 'GEMMA_3_4B', status: 'running' } 
  },
  { 
    id: '4', 
    type: 'toolNode', 
    position: { x: 450, y: 380 }, 
    data: { label: 'WEB_SEARCH', model: '', status: 'idle' } 
  }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--blue)' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--blue)' } },
  { id: 'e2-3', source: '2', target: '3', style: { stroke: 'var(--purple)' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--purple)' } },
  { id: 'e2-4', source: '2', target: '4', style: { stroke: 'var(--purple)' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--purple)' } },
];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = React.useState(false);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds: Edge[]) => addEdge({ ...params, animated: true, style: { stroke: 'var(--cyan)' } }, eds)), [setEdges]);

  const addNode = (type: 'agentNode' | 'toolNode' | 'routerNode') => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: 100, y: 100 },
      data: { 
        label: `NEW_${type.toUpperCase().replace('NODE', '')}`,
        model: type === 'agentNode' ? 'GEMMA_3_4B' : '',
        status: 'idle'
      },
    };
    setNodes((nds: any[]) => nds.concat(newNode));
  };

  const saveWorkflow = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('agentcloud_token');
      await fetch('/api/v1/workflows/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `MISSION_${Date.now()}`,
          definition: { nodes, edges }
        })
      });
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between p-3 border" style={{ borderColor: 'var(--border)', background: 'var(--bg1)', borderRadius: 8 }}>
         <div className="flex gap-2">
            <button onClick={() => addNode('agentNode')} className="btn btn-ghost btn-sm flex items-center gap-2" style={{ fontSize: 9 }}>
               <Bot size={14} /> [ +_AGENT ]
            </button>
            <button onClick={() => addNode('toolNode')} className="btn btn-ghost btn-sm flex items-center gap-2" style={{ fontSize: 9 }}>
               <Wrench size={14} /> [ +_TOOL ]
            </button>
            <button onClick={() => addNode('routerNode')} className="btn btn-ghost btn-sm flex items-center gap-2" style={{ fontSize: 9 }}>
               <GitBranch size={14} /> [ +_ROUTER ]
            </button>
         </div>
         <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" style={{ background: 'var(--green)', color: '#000', fontSize: 9 }}>
               <Play size={12} fill="#000" /> [ EXECUTE_MISSION ]
            </button>
            <button onClick={saveWorkflow} disabled={isSaving} className="btn btn-primary btn-sm" style={{ background: 'var(--cyan)', color: '#000', fontSize: 9 }}>
               <Save size={12} fill="#000" /> {isSaving ? '[ SAVING... ]' : '[ COMMIT_CHANGES ]'}
            </button>
         </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative border" style={{ background: 'var(--bg0)', borderColor: 'var(--border)', borderRadius: 12, minHeight: '600px' }}>
        <div className="scanline" style={{ borderRadius: 12 }}></div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls className="bg-black/60 border-white/10 fill-white scale-75 origin-bottom-left" />
          <MiniMap 
            style={{ background: 'var(--bg1)', borderRadius: '4px', border: '1px solid var(--border)' }}
            nodeStrokeColor={() => 'var(--cyan)'} 
            nodeColor={() => 'var(--bg2)'} 
            maskColor="rgba(0,0,0,0.6)"
          />
          <Background color="var(--border2)" gap={24} size={1} />
        </ReactFlow>
        
        {/* HUD OVERLAY */}
        <div className="absolute top-4 right-4 pointer-events-none text-right">
            <div className="text-[10px] font-black text-var(--cyan) tracking-widest uppercase" style={{ color: 'var(--cyan)', textShadow: 'var(--glow)' }}>
              MISSION_BUILDER_STUDIO // SECTOR_GAMMA
            </div>
            <div className="text-[8px] font-mono text-white/30 tracking-tight">ENCRYPTED_STREAM_V3.1_AES256</div>
        </div>
      </div>
    </div>
  );
}
