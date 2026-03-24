'use client';

import React from 'react';
import { Shield, TrendingUp, Zap } from 'lucide-react';

export default function AISummaryCard() {
  return (
    <div className="card p-5 border border-blue-500/20 bg-blue-500/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Zap size={64} className="text-blue-400" />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
          <Shield size={18} />
        </div>
        <h3 className="font-semibold text-blue-100 italic tracking-wide">Elite Fleet Summary</h3>
        <span className="ml-auto text-[10px] uppercase font-bold text-blue-400/60 border border-blue-400/20 px-1.5 py-0.5 rounded">Autonomous</span>
      </div>

      <p className="text-sm text-blue-200/80 leading-relaxed mb-6">
        "The system has autonomously recovered 4 critical task failures today. Cost savings are up by 12% due to smart agent routing. No compliance violations detected in the last 24 hours."
      </p>

      <div className="flex items-center justify-between text-[11px] font-mono text-blue-400/80">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} />
          <span>Efficiency: +4.2%</span>
        </div>
        <span>Last Update: Just Now</span>
      </div>
    </div>
  );
}
