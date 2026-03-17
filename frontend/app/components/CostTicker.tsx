'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

export default function CostTicker() {
  const [cost, setCost] = useState(2.47);

  useEffect(() => {
    const interval = setInterval(() => {
      setCost(prev => +(prev + (Math.random() * 0.05)).toFixed(2));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ac-pill" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', padding: '6px 12px' }}>
      <TrendingUp size={14} className="ac-text-accent" style={{ marginRight: '8px', color: 'var(--accent-primary)' }} />
      <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Token Cost Today:</span>
      <span style={{ color: 'var(--text-primary)', marginLeft: '8px', fontWeight: 700 }}>${cost}</span>
      <ArrowUpRight size={14} style={{ color: 'var(--accent-success)', marginLeft: '4px' }} />
      <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px', fontSize: '10px' }}>(updates 10s)</span>
    </div>
  );
}
