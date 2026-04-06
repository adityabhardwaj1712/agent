"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Zap, Shield, TrendingUp, BarChart3, Database, Globe, Cpu, MoreHorizontal, Download } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import KpiCard from '../ui/KpiCard';
import { AnalyticsSummary } from '../../lib/types';
import { usePolling } from '../../lib/usePolling';

const defaultMetrics: AnalyticsSummary = {
  success_rate: 98.4,
  total_tasks: 12408,
  avg_latency: 142,
  total_cost: 12.45,
  active_agents: 42
};

const AnalyticsView: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [fleetStatus, setFleetStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sumData, tsData, hmData, fleetData] = await Promise.all([
        apiFetch<any>('/analytics/summary'),
        apiFetch<any[]>('/analytics/timeseries'),
        apiFetch<any[]>('/analytics/success-heatmap'),
        apiFetch<any>('/analytics/fleet-health')
      ]);
      setSummary(sumData);
      setTimeseries(tsData || []);
      setHeatmap(hmData || []);
      setFleetStatus(fleetData);
    } catch (err) {
      console.error('Analytics fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 10000);

  useEffect(() => {
    fetchData();
  }, []);

  const metrics = summary || defaultMetrics;

  const kpiData = [
    { label: 'System Load', value: `${metrics.system_load || 0}%`, icon: Activity, color: metrics.system_load > 80 ? 'var(--red)' : 'var(--blue)', trend: 'NOMINAL' },
    { label: 'Neural Operations', value: (metrics.total_tasks || 0).toLocaleString(), icon: Zap, color: 'var(--amber)', trend: `+${metrics.active_events || 0}` },
    { label: 'Fleet Stability', value: `${metrics.success_rate || 0}%`, icon: Shield, color: 'var(--green)', trend: 'STABLE' },
    { label: 'Protocol Cost', value: `$${(metrics.total_cost || 0).toFixed(4)}`, icon: TrendingUp, color: 'var(--violet)', trend: 'SYNCED' },
  ];

  if (loading) return <div className="ms-content flex items-center justify-center h-full text-[var(--t2)] font-mono">NEURAL_SYNC_IN_PROGRESS...</div>;

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.8s ease-out' }}>
      {/* KPI Grid */}
      <div className="ms-grid-analytics grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiData.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', flex: 1 }}>
        {/* Main Resource Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="ms-glass-panel">
            <div className="ms-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg3)' }}>
              <div className="flex items-center gap-3">
                <BarChart3 size={18} style={{ color: 'var(--blue)' }} />
                <span className="text-sm font-bold">Mission Success Heatmap (24H)</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-[var(--t3)]">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> SUCCESS</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-rose-500"></div> FAIL</div>
              </div>
            </div>
            <div className="p-6">
               <div className="flex items-end gap-[6px] h-[200px] px-2">
                  {heatmap.map((d, i) => {
                    const total = d.success + d.failure;
                    const sH = total > 0 ? (d.success / 10) * 100 : 0; // Simple scaling
                    const fH = total > 0 ? (d.failure / 10) * 100 : 0;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                        <div className="w-full bg-rose-500/40 rounded-t-sm" style={{ height: `${Math.min(fH, 100)}%` }}></div>
                        <div className="w-full bg-emerald-500/60 rounded-sm" style={{ height: `${Math.min(sH, 100)}%` }}></div>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-all">
                           {d.hour}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>

          <div className="ms-glass-panel" style={{ flex: 1, padding: '24px' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Cpu size={18} style={{ color: 'var(--violet)' }} />
                <span className="text-sm font-bold">Fleet Health Distribution</span>
              </div>
            </div>
            <div className="flex items-center justify-around h-full">
               {/* Simple CSS Donut implementation */}
               <div className="relative w-40 h-40 rounded-full border-8 border-[var(--bg3)] flex items-center justify-center">
                  <div className="text-center">
                     <div className="text-2xl font-black text-white">{fleetStatus?.total || 0}</div>
                     <div className="text-[8px] font-mono text-[var(--t3)] uppercase">Active Agents</div>
                  </div>
                  {/* Dynamic ring could be added here with SVG */}
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-8 justify-between w-40">
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> <span className="text-[11px]">IDLE</span></div>
                     <span className="text-[11px] font-mono">{fleetStatus?.idle || 0}</span>
                  </div>
                  <div className="flex items-center gap-8 justify-between w-40">
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div> <span className="text-[11px]">RUNNING</span></div>
                     <span className="text-[11px] font-mono">{fleetStatus?.running || 0}</span>
                  </div>
                  <div className="flex items-center gap-8 justify-between w-40 opacity-40">
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-600"></div> <span className="text-[11px]">OFFLINE</span></div>
                     <span className="text-[11px] font-mono">{fleetStatus?.offline || 0}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Intelligence Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="ms-glass-panel" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))' }}>
            <div className="p-5">
              <div className="text-[10px] font-bold text-[var(--t3)] tracking-[2px] uppercase mb-4">Network Distribution</div>
              <div className="space-y-3">
                <div className="ms-node-status-row">
                  <Globe size={14} style={{ color: 'var(--blue)' }} />
                  <span className="flex-1 text-[11px] font-medium">AWS US-EAST-1</span>
                  <span className="text-[10px] font-mono text-[var(--green)]">0.12ms</span>
                </div>
                <div className="ms-node-status-row active">
                  <Globe size={14} style={{ color: 'var(--violet)' }} />
                  <span className="flex-1 text-[11px] font-medium">AZURE EU-WEST-2</span>
                  <span className="text-[10px] font-mono text-[var(--blue)]">0.45ms</span>
                </div>
                <div className="ms-node-status-row opacity-40">
                  <Globe size={14} style={{ color: 'var(--t3)' }} />
                  <span className="flex-1 text-[11px] font-medium">GCP ASIA-SOUTH</span>
                  <span className="text-[10px] font-mono">OFFLINE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ms-glass-panel flex-1">
             <div className="ms-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg3)' }}>
                <div className="flex items-center gap-2">
                  <Database size={16} style={{ color: 'var(--yellow)' }} />
                  <span className="text-sm font-bold">Persistence Layer</span>
                </div>
             </div>
             <div className="p-6">
                <div className="space-y-6">
                   <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--t3)]">Managed Entities</span>
                      <span className="font-mono text-[var(--text)]">14,208</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--t3)]">Neural Tokens</span>
                      <span className="font-mono text-[var(--text)]">2.4M</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--t3)]">Semantic Clusters</span>
                      <span className="font-mono text-[var(--text)]">1,024</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--t3)]">In-Memory Cache</span>
                      <span className="font-mono text-[var(--green)]">94.2% hit</span>
                   </div>
                </div>
                
                <button className="ms-btn ms-btn-sm w-full mt-10" style={{ background: 'var(--bg2)', borderColor: 'var(--bg3)', fontSize: '9px', letterSpacing: '2px' }}>
                  GENERATE ARCHIVE REPORT
                </button>
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ms-grid-analytics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        .ms-kpi-card {
          padding: 20px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ms-kpi-card:hover { transform: translateY(-4px); }
        .ms-kpi-value { font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 4px; letter-spacing: -0.5px; }
        .ms-kpi-label { font-size: 11px; font-weight: 600; color: var(--t3); text-transform: uppercase; letter-spacing: 0.5px; }
        .ms-kpi-progress { height: 3px; width: 100%; background: var(--bg3); border-radius: 100px; margin-top: 20px; overflow: hidden; }
        .ms-kpi-progress-bar { height: 100%; opacity: 0.6; }
        
        .ms-icon-box { width: 36px; height: 36px; border-radius: 100px; display: flex; align-items: center; justify-content: center; }
        .ms-trend-badge { font-size: 9px; font-weight: 800; color: var(--green); background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 200px; }
        
        .ms-progress-bin { height: 12px; background: var(--bg1); border: 1px solid var(--bg3); border-radius: 100px; padding: 2px; }
        .ms-progress-fill { height: 100%; border-radius: 100px; transition: width 1.5s ease-in-out; }
        
        .ms-visual-bar { flex: 1; border-radius: 4px 4px 0 0; transition: all 0.3s ease; cursor: pointer; }
        .ms-visual-bar:hover { filter: brightness(1.2); transform: scaleX(1.1); }
        
        .ms-node-status-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid transparent; }
        .ms-node-status-row.active { border-color: rgba(59, 130, 246, 0.2); background: rgba(59, 130, 246, 0.05); }
        
        .ms-btn-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bg3); display: flex; align-items: center; justify-content: center; color: var(--t3); cursor: pointer; transition: all 0.2s; }
        .ms-btn-icon:hover { color: var(--text); border-color: var(--blue); }
      `}</style>
    </div>
  );
};

export default AnalyticsView;
