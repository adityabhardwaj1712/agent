'use client';

import React from 'react';
import { Users, FileText, CheckCircle2, Zap } from 'lucide-react';

interface KPIItem {
  label: string;
  value: string;
  icon: React.ElementType;
  trend: number[];
  color: string;
}

const KPI_DATA: KPIItem[] = [
  { label: 'Active Agents', value: '46', icon: Users, trend: [20, 35, 25, 45, 30, 50, 46], color: 'var(--accent-primary)' },
  { label: 'Total Tasks', value: '1,26k', icon: FileText, trend: [10, 20, 15, 30, 25, 40, 35], color: 'var(--accent-purple)' },
  { label: 'Success Rate', value: '90%', icon: CheckCircle2, trend: [80, 85, 82, 88, 86, 92, 90], color: 'var(--accent-success)' },
  { label: 'Avg Latency', value: '10ms', icon: Zap, trend: [15, 12, 14, 11, 13, 10, 10], color: 'var(--accent-warning)' },
];

export default function KPIGrid() {
  return (
    <div className="ac-kpi-grid">
      {KPI_DATA.map((kpi) => (
        <div key={kpi.label} className="ac-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
             <span className="ac-kpi-label">{kpi.label}</span>
             <kpi.icon size={16} style={{ color: kpi.color, opacity: 0.8 }} />
          </div>
          <div className="ac-kpi-value">{kpi.value}</div>
          
          <div className="ac-kpi-trend" style={{ transition: 'transform 0.3s ease' }}>
            <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`grad-${kpi.label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={kpi.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={kpi.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d={`M 0 40 L 0 ${40 - kpi.trend[0]} ${kpi.trend.map((v, i) => `L ${i * (100 / (kpi.trend.length - 1))} ${40 - v}`).join(' ')} L 100 40 Z`}
                fill={`url(#grad-${kpi.label})`}
              />
              <path 
                d={`M 0 ${40 - kpi.trend[0]} ${kpi.trend.map((v, i) => `L ${i * (100 / (kpi.trend.length - 1))} ${40 - v}`).join(' ')}`}
                fill="none"
                stroke={kpi.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
