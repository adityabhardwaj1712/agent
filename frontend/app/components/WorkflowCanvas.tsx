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
import 'reactflow/dist/style.css';
import { Bot, Wrench, GitBranch, Zap, Play, Save } from 'lucide-react';

// --- Custom Nodes ---

const AgentNode = ({ data }: NodeProps) => (
  <div className={`ms-glass-panel relative border-[#2e6fff]/30 border-2 min-w-[200px] group ${data.status === 'running' ? 'animate-pulse shadow-[0_0_20px_#2e6fff/20]' : ''}`}>
    <Handle type="target" position={Position.Top} className="w-4 h-4 bg-[#2e6fff] border-2 border-white/20" />
    <div className="p-4">
       <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#2e6fff]/20 flex items-center justify-center text-[#2e6fff] border border-[#2e6fff]/30">
             <Bot size={20} />
          </div>
          <div>
             <div className="text-[10px] font-black text-[#2e6fff] uppercase tracking-widest leading-none mb-1">Agent_Neural_Link</div>
             <div className="text-[14px] font-bold text-white tracking-tighter">{data.label}</div>
          </div>
       </div>
       <div className="flex items-center justify-between text-[10px] font-mono p-2 rounded bg-black/40 border border-white/5">
          <span className="text-white/40 uppercase">Engine:</span>
          <span className="text-[#2e6fff] font-bold italic">{data.model || 'Gemma 3 4B'}</span>
       </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-[#2e6fff] border-2 border-white/20" />
    
    {/* Status Indicator */}
    <div className="absolute -top-3 -right-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/10 ${data.status === 'completed' ? 'bg-emerald-500' : data.status === 'running' ? 'bg-amber-500 animate-spin-slow' : 'bg-white/5 opacity-40'}`}>
           <Zap size={14} className="text-white fill-white/20" />
        </div>
    </div>
  </div>
);

const ToolNode = ({ data }: NodeProps) => (
  <div className="ms-glass-panel border-amber-500/30 border-2 min-w-[180px] bg-amber-500/5">
    <Handle type="target" position={Position.Top} className="w-4 h-4 bg-amber-500" />
    <div className="p-3">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
             <Wrench size={16} />
          </div>
          <div className="text-[12px] font-black uppercase tracking-[3px] text-white/80">{data.label}</div>
       </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-amber-500" />
  </div>
);

const RouterNode = ({ data }: NodeProps) => (
  <div className="ms-glass-panel border-violet-500/30 border-2 rotate-45 w-24 h-24 flex items-center justify-center shadow-[0_0_15px_#8b5cf6/20]">
    <Handle type="target" position={Position.Top} className="w-4 h-4 bg-violet-500 !-top-2" />
    <div className="-rotate-45 text-center flex flex-col items-center">
       <GitBranch size={20} className="text-violet-500 mb-1" />
       <div className="text-[9px] font-black tracking-widest text-[#8b5cf6] uppercase">Router_IX</div>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-violet-500 !-bottom-2" />
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
    data: { label: 'Strategist', model: 'Llama 3 70B' } 
  },
  { 
    id: '2', 
    type: 'routerNode', 
    position: { x: 300, y: 200 }, 
    data: { label: 'Decision Control' } 
  },
  { 
    id: '3', 
    type: 'agentNode', 
    position: { x: 100, y: 350 }, 
    data: { label: 'Researcher', model: 'Gemma 3 4B' } 
  },
  { 
    id: '4', 
    type: 'toolNode', 
    position: { x: 450, y: 350 }, 
    data: { label: 'Search_Tool' } 
  }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#2e6fff' } },
  { id: 'e2-3', source: '2', target: '3', style: { stroke: '#8b5cf6' } },
  { id: 'e2-4', source: '2', target: '4', style: { stroke: '#8b5cf6' } },
];

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = React.useState(false);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)), [setEdges]);

  const addNode = (type: 'agentNode' | 'toolNode' | 'routerNode') => {
    const id = `${nodes.length + 1}`;
    const newNode = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `New ${type.replace('Node', '')}` },
    };
    setNodes((nds: any[]) => nds.concat(newNode));
  };

  const saveWorkflow = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('agentcloud_token');
      const response = await fetch('/api/v1/workflows/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `Workflow_${Date.now()}`,
          definition: { nodes, edges }
        })
      });
      if (response.ok) {
        console.log('Workflow saved successfully');
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between p-2 ms-glass-panel">
         <div className="flex gap-2">
            <button onClick={() => addNode('agentNode')} className="ms-btn ms-btn-sm flex items-center gap-2">
               <Bot size={14} /> AGENT
            </button>
            <button onClick={() => addNode('toolNode')} className="ms-btn ms-btn-sm flex items-center gap-2">
               <Wrench size={14} /> TOOL
            </button>
            <button onClick={() => addNode('routerNode')} className="ms-btn ms-btn-sm flex items-center gap-2">
               <GitBranch size={14} /> ROUTER
            </button>
         </div>
         <div className="flex gap-2">
            <button className="ms-btn ms-btn-sm bg-emerald-500/20 border-emerald-500/50 flex items-center gap-2 hover:bg-emerald-500/30">
               <Play size={14} className="text-emerald-500" /> EXECUTE_DAG
            </button>
            <button 
              onClick={saveWorkflow}
              disabled={isSaving}
              className="ms-btn ms-btn-sm bg-[#2e6fff]/20 border-[#2e6fff]/50 flex items-center gap-2 hover:bg-[#2e6fff]/30 transition-all disabled:opacity-50"
            >
               <Save size={14} className="text-[#2e6fff]" /> 
               {isSaving ? 'SAVING...' : 'SAVE_STUDIO'}
            </button>
         </div>
      </div>
      
      <div className="flex-1 ms-glass-panel overflow-hidden relative" style={{ background: '#06090f', minHeight: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls className="bg-white/5 border-white/10 fill-white" />
          <MiniMap 
            style={{ background: '#09090b', borderRadius: '8px' }}
            nodeStrokeColor={(n: any) => '#334155'} 
            nodeColor={(n: any) => '#1e293b'} 
          />
          <Background color="#334155/20" gap={20} size={1} />
        </ReactFlow>
        
        {/* Overlay HUD */}
        <div className="absolute top-4 right-4 pointer-events-none">
           <div className="flex flex-col items-end gap-1">
              <div className="text-[10px] font-black text-[#2e6fff] tracking-widest uppercase">Visual_Workflow_Orchestration</div>
              <div className="text-[8px] font-mono text-white/30">STUDIO_REL_V1.2_BETA</div>
           </div>
        </div>
      </div>
    </div>
  );
}
