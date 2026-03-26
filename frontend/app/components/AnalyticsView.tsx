"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Zap, Shield, TrendingUp, BarChart3, Database, Globe, Cpu, MoreHorizontal, Download } from 'lucide-react';
import { apiFetch } from '../lib/api';

const defaultMetrics = {
  successRate: 98.4,
  totalTasks: 12408,
  avgLatency: 142,
  totalCost: 12.45,
  activeAgents: 42,
  resourceLoad: [42, 18, 76]
};

const AnalyticsView: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sumData, tsData] = await Promise.all([
        apiFetch<any>('/analytics/summary'),
        apiFetch<any[]>('/analytics/timeseries')
      ]);
      setSummary(sumData);
      setTimeseries(tsData || []);
    } catch (err) {
      console.error('Analytics fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const metrics = summary ? {
    successRate: summary.success_rate || defaultMetrics.successRate,
    totalTasks: summary.total_tasks || defaultMetrics.totalTasks,
    avgLatency: summary.avg_latency || defaultMetrics.avgLatency,
    totalCost: summary.total_cost || defaultMetrics.totalCost,
    activeAgents: summary.active_agents || defaultMetrics.activeAgents,
    resourceLoad: defaultMetrics.resourceLoad
  } : defaultMetrics;

  const kpis = [
    { label: 'Fleet Stability', value: `${metrics.successRate}%`, icon: Shield, color: 'var(--green)', trend: '+0.2%' },
    { label: 'Neural Operations', value: metrics.totalTasks.toLocaleString(), icon: Activity, color: 'var(--blue)', trend: '+124' },
    { label: 'Network Latency', value: `${metrics.avgLatency}ms`, icon: Zap, color: 'var(--yellow)', trend: '-2ms' },
    { label: 'Protocol Cost', value: `$${metrics.totalCost.toFixed(4)}`, icon: TrendingUp, color: 'var(--violet)', trend: '+$0.02' },
  ];

  const models = [
    { name: 'LLama 3.1 70B', load: metrics.resourceLoad[0], type: 'Heavy Duty Inference', color: 'var(--blue)' },
    { name: 'LLama 3.1 8B', load: metrics.resourceLoad[1], type: 'Fast Response Edge', color: 'var(--green)' },
    { name: 'Mixtral 8x7B', load: metrics.resourceLoad[2], type: 'MoE Logic Engine', color: 'var(--violet)' },
  ];

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.8s ease-out' }}>
      {/* KPI Grid */}
      <div className="ms-grid-analytics">
        {kpis.map((kpi, i) => (
          <div key={i} className="ms-glass-panel ms-kpi-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="ms-icon-box" style={{ background: `rgba(${kpi.color === 'var(--blue)' ? '59, 130, 246' : '16, 185, 129'}, 0.1)` }}>
                <kpi.icon style={{ color: kpi.color }} size={20} />
              </div>
              <span className="ms-trend-badge">{kpi.trend}</span>
            </div>
            <div className="ms-kpi-value">{kpi.value}</div>
            <div className="ms-kpi-label">{kpi.label}</div>
            <div className="ms-kpi-progress">
              <div className="ms-kpi-progress-bar" style={{ width: '70%', background: kpi.color }}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', flex: 1 }}>
        {/* Main Resource Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="ms-glass-panel">
            <div className="ms-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg3)' }}>
              <div className="flex items-center gap-3">
                <Cpu size={18} style={{ color: 'var(--blue)' }} />
                <span className="text-sm font-bold">Neural Resource Utilization</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] text-[var(--t3)]">
                  <div className="ms-dot ms-dot-g"></div> SYSTEM_OPTIMAL
                </div>
                <MoreHorizontal size={14} style={{ color: 'var(--t3)', cursor: 'pointer' }} />
              </div>
            </div>
            <div className="p-6 space-y-10">
              {models.map((model, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[13px] font-bold text-[var(--text)]">{model.name}</div>
                      <div className="text-[9px] text-[var(--t3)] font-mono uppercase tracking-widest">{model.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono text-[var(--text)]">{model.load}%</div>
                      <div className="text-[9px] text-[var(--t3)] uppercase">Active Load</div>
                    </div>
                  </div>
                  <div className="ms-progress-bin">
                    <div 
                      className="ms-progress-fill" 
                      style={{ width: `${model.load}%`, background: model.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ms-glass-panel" style={{ flex: 1, padding: '24px' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BarChart3 size={18} style={{ color: 'var(--violet)' }} />
                <span className="text-sm font-bold">Mission Throughput Topology</span>
              </div>
              <button className="ms-btn-icon"><Download size={14} /></button>
            </div>
            <div className="flex items-end gap-[8px] h-[240px] px-2">
              {(timeseries.length > 0 ? timeseries : [40, 65, 45, 95, 70, 35, 85, 60, 98, 75, 45, 65, 90, 55, 80, 95, 45, 65, 35, 55]).map((d, i) => {
                const h = typeof d === 'number' ? d : (d.value * 5); // Scale value for visual
                return (
                  <div 
                    key={i} 
                    className="ms-visual-bar"
                    style={{ height: `${Math.min(h, 100)}%`, background: `linear-gradient(to top, rgba(59, 130, 246, 0.1), var(--blue))` }}
                    title={d.time ? `${d.time}: ${d.value} tasks` : undefined}
                  ></div>
                );
              })}
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
        
        .ms-node-status-row { display: flex; items-center; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid transparent; }
        .ms-node-status-row.active { border-color: rgba(59, 130, 246, 0.2); background: rgba(59, 130, 246, 0.05); }
        
        .ms-btn-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bg3); display: flex; items-center; justify-content: center; color: var(--t3); cursor: pointer; transition: all 0.2s; }
        .ms-btn-icon:hover { color: var(--text); border-color: var(--blue); }
      `}</style>
    </div>
  );
};

export default AnalyticsView;
