import React, { useEffect, useRef, useState } from 'react';
import { Bot, Zap, Share2 } from 'lucide-react';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  status: 'idle' | 'active' | 'success' | 'fail';
}

interface Packet {
  id: string;
  from: string;
  to: string;
  progress: number;
}

export default function SwarmTelemetry() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', x: 100, y: 150, label: 'Strategist', status: 'idle' },
    { id: '2', x: 300, y: 150, label: 'Researcher_A', status: 'idle' },
    { id: '3', x: 300, y: 250, label: 'Researcher_B', status: 'idle' },
    { id: '4', x: 500, y: 200, label: 'Critic_Omega', status: 'idle' },
  ]);
  const [packets, setPackets] = useState<Packet[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Connections (Neural Mesh)
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(46, 111, 255, 0.1)';
      ctx.lineWidth = 1;
      nodes.forEach(n1 => {
        nodes.forEach(n2 => {
          if (n1.id < n2.id) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        });
      });
      ctx.setLineDash([]);

      // Draw Packets
      packets.forEach(p => {
        const fromNode = nodes.find(n => n.id === p.from);
        const toNode = nodes.find(n => n.id === p.to);
        if (fromNode && toNode) {
          const px = fromNode.x + (toNode.x - fromNode.x) * p.progress;
          const py = fromNode.y + (toNode.y - fromNode.y) * p.progress;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#2e6fff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#2e6fff';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Nodes
      nodes.forEach(node => {
        // Glow effect
        if (node.status === 'active') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(46, 111, 255, 0.15)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = node.status === 'active' ? '#2e6fff' : '#1e293b';
        ctx.strokeStyle = '#2e6fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fill();

        // Label
        ctx.fillStyle = 'white';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 25);
      });

      raf = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, [nodes, packets]);

  // Simulation: Move packets
  useEffect(() => {
    const pulse = setInterval(() => {
      setPackets(prev => {
        const updated = prev.map(p => ({ ...p, progress: p.progress + 0.02 })).filter(p => p.progress < 1);
        if (Math.random() > 0.8) {
           const from = nodes[Math.floor(Math.random() * nodes.length)].id;
           const to = nodes[Math.floor(Math.random() * nodes.length)].id;
           if (from !== to) updated.push({ id: Math.random().toString(), from, to, progress: 0 });
        }
        return updated;
      });
    }, 50);
    return () => clearInterval(pulse);
  }, [nodes]);

  return (
    <div className="ms-glass-panel h-full relative overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Share2 size={16} className="text-[#2e6fff]" />
          <span className="text-xs font-bold uppercase tracking-wider">Swarm_Telemetry_Mesh</span>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#2e6fff] animate-pulse" />
             <span className="text-[10px] text-white/40">DATA_TRANSIT</span>
           </div>
           <div className="text-[10px] font-mono text-[#2e6fff]">SYNK_READY</div>
        </div>
      </div>
      <canvas ref={canvasRef} width={600} height={400} className="w-full h-[320px]" />
      
      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-2">
         {nodes.slice(0, 4).map(n => (
           <div key={n.id} className="ms-glass-panel p-2 flex items-center gap-2 bg-white/5">
              <Bot size={12} className="text-[#2e6fff]" />
              <div className="overflow-hidden">
                 <div className="text-[9px] font-bold truncate">{n.label}</div>
                 <div className="text-[7px] font-mono opacity-40 uppercase">IDLE</div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
