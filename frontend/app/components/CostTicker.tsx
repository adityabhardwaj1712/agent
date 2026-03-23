'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, TrendingUp, Info, PieChart, Activity } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface CostData {
  cost_total: number;
  cost_daily_burn: number;
  cost_by_model: Record<string, number>;
  cost_by_agent: Record<string, number>;
}

export default function CostTicker() {
  const [data, setData] = useState<CostData | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiFetch('/analytics/metrics');
        setData(result);
      } catch (err) {
        console.error("Failed to fetch cost data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return (
    <div className="ac-pill" style={{ opacity: 0.6 }}>
      <TrendingUp size={14} style={{ marginRight: '8px' }} />
      <span style={{ fontSize: '11px' }}>Loading costs...</span>
    </div>
  );

  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setShowPopup(true)} onMouseLeave={() => setShowPopup(false)}>
      <div className="ac-pill" style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-active)', 
        padding: '6px 14px',
        cursor: 'help',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Activity size={14} style={{ color: 'var(--accent-primary)' }} />
        <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Burn:</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${data.cost_daily_burn.toFixed(2)}</span>
        <div style={{ width: '1px', height: '12px', background: 'var(--border-muted)', margin: '0 4px' }} />
        <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total:</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${data.cost_total.toFixed(2)}</span>
        <ArrowUpRight size={14} style={{ color: 'var(--accent-success)' }} />
      </div>

      {showPopup && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '12px',
          width: '280px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-active)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          zIndex: 100,
          animation: 'slideUp 0.2s ease-out'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={14} className="ac-text-accent" />
            Cost Breakdown
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div>
               <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600 }}>BY MODEL</div>
               {Object.entries(data.cost_by_model).map(([model, cost]) => (
                 <div key={model} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{model}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${cost.toFixed(3)}</span>
                 </div>
               ))}
             </div>

             <div style={{ borderTop: '1px solid var(--border-muted)', paddingTop: '16px' }}>
               <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600 }}>TOP AGENTS</div>
               {Object.entries(data.cost_by_agent).map(([agent, cost]) => (
                 <div key={agent} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>{agent}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${cost.toFixed(3)}</span>
                 </div>
               ))}
             </div>
          </div>

          <div style={{ marginTop: '20px', padding: '10px', borderRadius: '12px', background: 'var(--bg-tertiary)', fontSize: '10px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
             Burn rate: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>${(data.cost_daily_burn / 24).toFixed(4)}/hr</span>
          </div>
        </div>
      )}
    </div>
  );
}
