// frontend/app/components/KpiCard.tsx
"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color: string;
  trend?: 'up' | 'down' | string;
  trendLabel?: string;
  sparkData?: number[];
  progress?: number;
}

function sparklinePath(data: number[], w: number, h: number): string {
  if (data.length < 2) return '';
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  return data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  label, value, icon: Icon, color, trend, trendLabel, sparkData, progress 
}) => {
  const path = sparkData ? sparklinePath(sparkData, 88, 36) : null;
  
  return (
    <div className="ms-glass-panel ms-kpi-card group p-5 relative overflow-hidden transition-transform hover:-translate-y-1">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      
      <div className="flex items-center justify-between mb-4">
        {Icon ? (
          <div 
            className="ms-icon-box w-9 h-9 rounded-full flex items-center justify-center" 
            style={{ background: `rgba(${color.includes('blue') ? '59, 130, 246' : '16, 185, 129'}, 0.1)` }}
          >
            <Icon style={{ color }} size={20} />
          </div>
        ) : (
          <div className="text-[9px] font-bold font-mono tracking-widest text-[var(--t2)] uppercase">{label}</div>
        )}
        
        {trend && (
          <span className={`ms-trend-badge text-[9px] font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
             {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendLabel || trend}
          </span>
        )}
      </div>

      <div className="ms-kpi-value text-2xl font-extrabold text-[#dde8ff] mb-1 tracking-tight leading-tight">{value}</div>
      {Icon && <div className="ms-kpi-label text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</div>}

      {progress !== undefined && (
        <div className="ms-kpi-progress h-[3px] w-full bg-[#1f2937] rounded-full mt-5 overflow-hidden">
          <div className="ms-kpi-progress-bar h-full opacity-60" style={{ width: `${progress}%`, background: color }}></div>
        </div>
      )}

      {path && (
        <svg style={{ position: 'absolute', bottom: 0, right: 0, width: 88, height: 36, opacity: 0.32 }} viewBox="0 0 88 36">
          <path d={path} fill="none" stroke={color} strokeWidth={2} />
        </svg>
      )}
    </div>
  );
};

export default KpiCard;
