// frontend/app/components/StatusPill.tsx
"use client";

import React from 'react';

interface StatusPillProps {
  status: string;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const s = status?.toLowerCase() || 'unknown';
  
  const map: Record<string, { bg: string; text: string; label: string }> = {
    running: { bg: 'rgba(46,111,255,0.1)', text: 'var(--blue, #2e6fff)', label: 'RUNNING' },
    in_progress: { bg: 'rgba(46,111,255,0.1)', text: 'var(--blue, #2e6fff)', label: 'RUNNING' },
    completed: { bg: 'rgba(0,232,149,0.09)', text: 'var(--green, #00e895)', label: 'COMPLETED' },
    failed: { bg: 'rgba(255,45,78,0.1)', text: 'var(--red, #ff2d4e)', label: 'FAILED' },
    pending: { bg: 'rgba(255,170,26,0.1)', text: 'var(--yellow, #ffaa1a)', label: 'PENDING' },
    queued: { bg: 'var(--bg3, #1a2236)', text: 'var(--t2)', label: 'QUEUED' },
  };

  const { bg, text, label } = map[s] || { bg: 'var(--bg3)', text: 'var(--t2)', label: s.toUpperCase() };

  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold border"
      style={{ background: bg, color: text, borderColor: `${text}22` }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default StatusPill;
