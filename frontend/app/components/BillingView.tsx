'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  DollarSign, 
  ArrowUpRight, 
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

export default function BillingView() {
  const [data, setData] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(100);
  const toast = useToast();

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const [sub, pred, opt] = await Promise.all([
          apiFetch<any>('/billing/subscription'),
          apiFetch<any>('/billing/predict'),
          apiFetch<any>(`/billing/optimize?budget=${budget}`)
        ]);
        setData(sub);
        setPrediction(pred);
        setSuggestions(opt || []);
      } catch (err: any) {
        toast(err.message || 'Failed to fetch billing data', 'err');
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [budget]);

  if (loading) {
    return (
      <div className="ms-content flex-center">
        <div className="ms-loader-ring" style={{ borderTopColor: 'var(--yellow)' }}></div>
        <div style={{ marginTop: 20, color: 'var(--t3)', letterSpacing: '2px', fontSize: '10px' }}>CALCULATING_RESOURCE_EXPENDITURE...</div>
      </div>
    );
  }

  const usage = data?.usage || {};
  const costs = data?.costs || {};
  const savings = data?.savings || {};
  const breakdown = costs.breakdown || {};
  const agentNames = Object.keys(breakdown);

  return (
    <div className="ms-content" style={{ gap: '28px', animation: 'ms-fade-in 0.8s ease-out' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div className="ms-glass-panel ms-kpi-card" style={{ '--accent': 'var(--green)' } as any}>
          <div className="flex justify-between items-start mb-4">
             <div className="icon-box"><TrendingUp size={18} /></div>
             <div className="ms-badge ms-b-g">+12.4%</div>
          </div>
          <div className="val" style={{ color: 'var(--green)' }}>{data?.roi_percentage ?? 0}%</div>
          <div className="lbl">INVESTMENT_ROI</div>
        </div>

        <div className="ms-glass-panel ms-kpi-card" style={{ '--accent': 'var(--yellow)' } as any}>
          <div className="flex justify-between items-start mb-4">
             <div className="icon-box"><DollarSign size={18} /></div>
             <ArrowUpRight size={14} style={{ color: 'var(--t3)' }} />
          </div>
          <div className="val" style={{ color: 'var(--yellow)' }}>${costs.total_cost ?? '0.00'}</div>
          <div className="lbl">TOTAL_EXPENDITURE</div>
        </div>

        <div className="ms-glass-panel ms-kpi-card" style={{ '--accent': 'var(--blue)' } as any}>
          <div className="flex justify-between items-start mb-4">
             <div className="icon-box"><Zap size={18} /></div>
             <Activity size={14} style={{ color: 'var(--t3)' }} />
          </div>
          <div className="val" style={{ color: 'var(--blue)' }}>{usage.tasks ?? 0}</div>
          <div className="lbl">OPERATIONS_EXECUTED</div>
        </div>

        <div className="ms-glass-panel ms-kpi-card" style={{ '--accent': 'var(--violet)' } as any}>
          <div className="flex justify-between items-start mb-4">
             <div className="icon-box"><Clock size={18} /></div>
             <div className="ms-badge ms-b-p">EFFICIENCY</div>
          </div>
          <div className="val" style={{ color: 'var(--violet)' }}>{savings.hours_saved ?? 0}</div>
          <div className="lbl">HUMAN_HOURS_SAVED</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', flex: 1, minHeight: 0 }}>
        {/* Agent Usage Breakdown */}
        <div className="ms-glass-panel flex flex-col">
          <div className="ms-card-hd" style={{ padding: '20px 24px', borderBottom: '1px solid var(--bg3)' }}>
             <div className="flex items-center gap-3">
                <BarChart3 size={16} style={{ color: 'var(--t3)' }} />
                <span style={{ fontSize: '12px', fontWeight: 800 }}>RESOURCE_UTILIZATION_BY_ENTITY</span>
             </div>
             <div className="ms-badge ms-b-b">{agentNames.length} AGENTS_ACTIVE</div>
          </div>
          
          <div className="ms-billing-list">
            {agentNames.length === 0 ? (
              <div className="flex-center flex-col py-32 opacity-30">
                 <Layers size={48} style={{ marginBottom: 16 }} />
                 <div style={{ fontSize: '12px', fontWeight: 600 }}>NO_UTILIZATION_DATA_FOUND</div>
              </div>
            ) : (
              agentNames.map((name, i) => {
                const agent = breakdown[name];
                const hue = name.length * 45;
                return (
                  <div key={i} className="ms-billing-row group">
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="ms-mini-avatar" 
                        style={{ 
                          background: `linear-gradient(135deg, hsl(${hue},60%,15%), hsl(${hue},60%,25%))`,
                          border: `1px solid hsl(${hue},60%,40%)`,
                          color: `hsl(${hue},100%,80%)`
                        }}
                      >
                        {name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="name">{name}</div>
                        <div className="meta">
                          {agent.tasks} OPERATIONS · <span style={{ color: 'var(--green)' }}>{agent.roi}% ROI</span>
                        </div>
                      </div>
                    </div>
                    <div className="cost-box">
                       <div className="val">${agent.cost}</div>
                       <div className="lbl">USD_EQUIV</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment & Subscription */}
        <div className="ms-glass-panel p-6 flex flex-col" style={{ height: 'fit-content' }}>
           <div className="flex items-center gap-3 mb-8">
              <CreditCard size={18} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: '12px', fontWeight: 800 }}>PAYMENT_INFRASTRUCTURE</span>
           </div>

           <div className="ms-subs-card mb-8">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <div className="text-[10px] text-[var(--t3)] font-bold uppercase tracking-widest mb-1">Current Plan</div>
                    <div className="text-lg font-black text-white">ENTERPRISE_PREMIUM</div>
                 </div>
                 <div className="ms-badge ms-b-g">ACTIVE</div>
              </div>
              
              <div className="space-y-4 mb-8">
                 <div className="flex items-center gap-2 text-[11px] text-[var(--t2)]">
                    <CheckCircle size={10} className="text-[var(--green)]" /> Unlimited Swarm Operations
                 </div>
                 <div className="flex items-center gap-2 text-[11px] text-[var(--t2)]">
                    <CheckCircle size={10} className="text-[var(--green)]" /> Advanced Neural Memory
                 </div>
                 <div className="flex items-center gap-2 text-[11px] text-[var(--t2)]">
                    <CheckCircle size={10} className="text-[var(--green)]" /> Multi-Token LLM Routing
                 </div>
              </div>

              <button className="ms-btn ms-btn-p w-full" style={{ height: '44px', fontSize: '12px' }}>MANAGE_SUBSCRIPTION</button>
           </div>

           <div className="p-4 rounded-xl bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.1)] mb-8">
              <div className="text-[10px] text-[var(--blue)] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Zap size={10} /> Auto-Scaling Enabled
              </div>
              <p className="text-[10px] leading-relaxed text-[var(--t2)]">
                 Infrastructure is currently scaling across 4 nodes. Token utilization is optimized for high-performance clusters.
              </p>
           </div>

           {/* Cost Predictor */}
           <div className="ms-card p-5 border-dashed border-[var(--bg3)]" style={{ background: 'transparent' }}>
              <div className="flex items-center justify-between mb-4">
                 <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--t3)' }}>RES_PREDICTION_EOM</div>
                 <div className="ms-badge ms-b-y">ESTIMATED</div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                 <div className="text-2xl font-black text-white">${prediction?.predicted_total || '0.00'}</div>
                 <div className="text-[10px] font-bold text-[var(--red)]"> projected</div>
              </div>
              <div className="text-[10px] text-[var(--t3)] font-mono">RUN_RATE: ${prediction?.run_rate || '0.00'}/DAY</div>
           </div>

           {/* Optimization Suggesions */}
           {suggestions.length > 0 && (
             <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                   <div style={{ width: 6, height: 6, background: 'var(--blue)', borderRadius: '50%' }}></div>
                   <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>SMART_OPTIMIZATION_HUB</span>
                </div>
                <div className="space-y-3">
                   {suggestions.map((s, i) => (
                      <div key={i} className="p-4 rounded-xl bg-[rgba(0,255,170,0.03)] border border-[rgba(0,255,170,0.1)]">
                         <div className="text-[11px] font-bold text-[var(--green)] flex items-center justify-between">
                            {s.action}
                            <span>${s.potential_savings} SAVE</span>
                         </div>
                         <div className="text-[10px] text-[var(--t3)] mt-1">{s.suggestion}</div>
                         <button className="text-[9px] font-bold text-[var(--blue)] mt-3 hover:underline">APPROVE_OPTIMIZATION</button>
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>

      <style jsx>{`
        .ms-kpi-card {
           padding: 24px;
           transition: all 0.3s;
           border-bottom: 2px solid transparent;
        }
        .ms-kpi-card:hover { transform: translateY(-4px); border-bottom-color: var(--accent); }
        .ms-kpi-card .icon-box { 
          width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.05); 
          display: flex; align-items: center; justify-content: center; color: var(--accent);
        }
        .ms-kpi-card .val { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
        .ms-kpi-card .lbl { font-size: 10px; color: var(--t3); font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
        
        .ms-billing-list { flex: 1; overflow-y: auto; }
        .ms-billing-row { 
          display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--bg3);
          transition: background 0.2s;
        }
        .ms-billing-row:last-child { border-bottom: none; }
        .ms-billing-row:hover { background: rgba(255,255,255,0.02); }
        
        .ms-mini-avatar {
          width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-family: var(--mono); font-weight: 800;
        }
        .ms-billing-row .name { font-size: 14px; font-weight: 800; color: var(--text); }
        .ms-billing-row .meta { font-size: 10px; color: var(--t3); font-family: var(--mono); margin-top: 2px; }
        
        .cost-box { text-align: right; }
        .cost-box .val { font-family: var(--mono); font-size: 15px; font-weight: 800; color: var(--yellow); }
        .cost-box .lbl { font-size: 8px; color: var(--t3); font-weight: 700; }
        
        .ms-subs-card {
           background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
           border: 1px solid var(--bg3);
           border-radius: 16px;
           padding: 24px;
        }
      `}</style>
    </div>
  );
}

function CheckCircle({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size || 16} 
      height={size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
