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

    let width = canvas.width;
    let height = canvas.height;
    let rotation = 0;
    const dots: { x: number; y: number; z: number; r: number }[] = [];
    const count = 300;

    // Initialize dots on a sphere
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      dots.push({
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
        r: 1 + Math.random() * 2
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      rotation += 0.005;

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.4;

      // Draw atmospheric glow
      const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.2);
      glow.addColorStop(0, 'rgba(46, 111, 255, 0.05)');
      glow.addColorStop(1, 'rgba(46, 111, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Projects and draw dots
      dots.forEach((dot) => {
        // Rotate around Y axis
        const x = dot.x * Math.cos(rotation) - dot.z * Math.sin(rotation);
        const z = dot.x * Math.sin(rotation) + dot.z * Math.cos(rotation);
        const y = dot.y;

        // Simple perspective projection
        const scale = 1 / (2 - z);
        const px = centerX + x * radius * scale;
        const py = centerY + y * radius * scale;
        const alpha = (z + 1) / 2;

        if (z > -0.5) { // Only draw front dots for depth
          ctx.beginPath();
          ctx.arc(px, py, dot.r * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(46, 111, 255, ${alpha * 0.8})`;
          ctx.fill();
          
          // Add connections for "Neural" look
          dots.forEach((other) => {
             const dist = Math.sqrt((dot.x-other.x)**2 + (dot.y-other.y)**2 + (dot.z-other.z)**2);
             if (dist < 0.25) {
                const ox = other.x * Math.cos(rotation) - other.z * Math.sin(rotation);
                const oz = other.x * Math.sin(rotation) + other.z * Math.cos(rotation);
                const oy = other.y;
                const oscale = 1 / (2 - oz);
                const opx = centerX + ox * radius * oscale;
                const opy = centerY + oy * radius * oscale;
                
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(opx, opy);
                ctx.strokeStyle = `rgba(46, 111, 255, ${alpha * 0.15})`;
                ctx.stroke();
             }
          });
        }
      });

      requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || 500;
      canvas.height = canvas.parentElement?.clientHeight || 500;
      width = canvas.width;
      height = canvas.height;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    const animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center relative overflow-hidden">
      <canvas ref={canvasRef} className="opacity-80" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(6,9,15,0.4)_100%)]" />
    </div>
  );
}
