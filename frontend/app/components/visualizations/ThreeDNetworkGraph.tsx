"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

const Node = ({ position, color, label, size = 1 }: { position: [number, number, number], color: string, label: string, size?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state: any) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[size, 32, 32]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
      </Sphere>
      <Html distanceFactor={10} position={[0, size + 0.5, 0]} center>
        <div style={{ color: 'white', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', whiteSpace: 'nowrap' }}>
          {label}
        </div>
      </Html>
    </group>
  );
};

export default function ThreeDNetworkGraph() {
  const nodes = useMemo(() => {
    return [
      { id: "core", pos: [0, 0, 0], color: "#3B82F6", label: "Core Router", size: 1.5 },
      { id: "gemma1", pos: [4, 2, -3], color: "#10B981", label: "Gemma 3 270M (Edge)", size: 0.8 },
      { id: "gemma2", pos: [-3, -1, 4], color: "#8B5CF6", label: "Gemma 3n 2B (Node A)", size: 1 },
      { id: "data", pos: [2, -3, 2], color: "#F59E0B", label: "Vector Lake", size: 1.2 },
      { id: "worker", pos: [-4, 3, -1], color: "#EF4444", label: "Worker-01", size: 0.8 }
    ];
  }, []);

  const edges = useMemo(() => {
    return [
      { source: "core", target: "gemma1" },
      { source: "core", target: "gemma2" },
      { source: "core", target: "data" },
      { source: "core", target: "worker" },
      { source: "data", target: "gemma2" }
    ];
  }, []);

  const getPos = (id: string) => nodes.find(n => n.id === id)?.pos as [number, number, number] || [0,0,0];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', background: '#09090b', borderRadius: '12px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {nodes.map(n => (
          <Node key={n.id} position={n.pos as [number, number, number]} color={n.color} label={n.label} size={n.size} />
        ))}

        {edges.map((e, idx) => {
          const start = new THREE.Vector3(...getPos(e.source));
          const end = new THREE.Vector3(...getPos(e.target));
          return (
            <Line key={idx} points={[start, end]} color="#334155" lineWidth={1} transparent opacity={0.5} />
          );
        })}

        <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
