'use client';

import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

const INCIDENTS = [
  { time: '14:32', agent: 'Agent cost spiked 5x', status: 'normal', type: 'warning' },
  { time: '14:33', agent: 'Circuit breaker triggered', status: '', type: 'critical' },
  { time: '14:32', agent: 'Agent cost spiked', status: 'normal', type: 'warning' },
  { time: '14:32', agent: 'Circuit breaker triggered', status: '', type: 'critical' },
];

export default function IncidentTimeline() {
  return (
    <div className="ac-widget">
      <div className="ac-widget-title">
         <span>Incident Timeline</span>
         <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>source 44</span>
      </div>
      
      <div className="ac-timeline">
        {INCIDENTS.map((item, i) => (
          <div key={i} className="ac-timeline-item" style={{ 
            padding: item.type === 'critical' ? '12px' : '0', 
            background: item.type === 'critical' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
            borderRadius: '8px',
            border: item.type === 'critical' ? '1px solid rgba(239, 68, 68, 0.1)' : 'none'
          }}>
            <div className="ac-timeline-icon" style={{ background: item.type === 'critical' ? 'var(--accent-danger)' : 'var(--accent-warning)', color: 'white' }}>
               {item.type === 'critical' ? <ShieldAlert size={12} /> : <AlertTriangle size={12} />}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {item.time}: {item.agent}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {item.time}: {item.status || 'Active'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
