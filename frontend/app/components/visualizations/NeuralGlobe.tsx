'use client';

import React, { useEffect, useRef } from 'react';

/**
 * NeuralGlobe.tsx
 * A high-fidelity, Canvas-based 3D globe visualization.
 * No external dependencies (Three.js alternative).
 */
export default function NeuralGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotation = 0;
    const dots: { x: number; y: number; z: number; r: number; neighbors: number[] }[] = [];
    const count = 300;

    // Initialize dots on a sphere
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      dots.push({
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
        r: 1 + Math.random() * 2,
        neighbors: []
      });
    }

    // Pre-calculate connections (Neural Linkage)
    // Rigid body: distances don't change during rotation
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dist = Math.sqrt(
          (dots[i].x - dots[j].x)**2 + 
          (dots[i].y - dots[j].y)**2 + 
          (dots[i].z - dots[j].z)**2
        );
        if (dist < 0.22) { // Slightly tighter link for performance
          dots[i].neighbors.push(j);
        }
      }
    }

    let animationFrameId: number;

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rotation += 0.004;

      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.42;

      // Projects all dots first
      const projected = dots.map(dot => {
        const x = dot.x * Math.cos(rotation) - dot.z * Math.sin(rotation);
        const z = dot.x * Math.sin(rotation) + dot.z * Math.cos(rotation);
        const y = dot.y;
        const scale = 1.2 / (2.5 - z);
        return {
          px: centerX + x * radius * scale,
          py: centerY + y * radius * scale,
          z,
          scale,
          alpha: (z + 1) / 2
        };
      });

      // Draw Connections (Optimized: O(n + connections))
      ctx.lineWidth = 0.8;
      dots.forEach((dot, i) => {
        const p1 = projected[i];
        if (p1.z < -0.4) return; // Cull back-facing linkages early

        dot.neighbors.forEach(ni => {
          const p2 = projected[ni];
          if (p2.z < -0.4) return;

          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.strokeStyle = `rgba(46, 111, 235, ${Math.min(p1.alpha, p2.alpha) * 0.12})`;
          ctx.stroke();
        });
      });

      // Draw Dots
      dots.forEach((dot, i) => {
        const p = projected[i];
        if (p.z < -0.6) return; // Cull back dots

        ctx.beginPath();
        ctx.arc(p.px, p.py, dot.r * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(46, 111, 255, ${p.alpha * 0.85})`;
        ctx.fill();
        
        if (p.z > 0.8 && Math.random() > 0.98) { // Neural Pulse effect
           ctx.beginPath();
           ctx.arc(p.px, p.py, (dot.r + 4) * p.scale, 0, Math.PI * 2);
           ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
           ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (canvas) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    render();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center relative overflow-hidden">
      <canvas ref={canvasRef} className="opacity-80" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(6,9,15,0.4)_100%)]" />
    </div>
  );
}
