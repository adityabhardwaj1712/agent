'use client';

import { useState, useEffect, use } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  Shield, 
  Database, 
  History, 
  TrendingUp, 
  DollarSign, 
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

interface AgentMetrics {
  name: string;
  total_tasks: number;
  success_rate: number;
  total_cost: number;
  reputation: number;
  status_breakdown: Record<string, number>;
}

interface TaskHistory {
  task_id: string;
  status: string;
  payload: string;
  result: string | null;
  created_at: string;
  cost: number;
}

export default function AgentDetailPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, hRes] = await Promise.all([
          apiFetch(`/agents/${agentId}/metrics`),
          apiFetch(`/agents/${agentId}/history`)
        ]);
        setMetrics(mRes);
        setHistory(hRes);
      } catch (err) {
        console.error("Failed to fetch agent details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [agentId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!metrics) return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Agent not found</h1>
      <Link href="/agents" className="ac-btn-primary">Back to Agents</Link>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <Link href="/agents" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{metrics.name}</h1>
            <p className="text-tertiary flex items-center gap-2 mt-1">
              <Shield size={14} className="text-accent" />
              Agent ID: <span className="font-mono text-xs">{agentId}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="ac-btn-secondary px-6">Edit Profile</button>
          <button className="ac-btn-primary px-6">Launch New Task</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="ac-card p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-tertiary uppercase tracking-wider mb-2">Success Rate</p>
            <h3 className="text-2xl font-black">{metrics.success_rate.toFixed(1)}%</h3>
            <div className="mt-2 text-xs text-secondary flex items-center gap-1">
              <CheckCircle2 size={12} className="text-success" />
              {metrics.total_tasks} total tasks
            </div>
          </div>
          <Activity className="text-accent opacity-20" size={32} />
        </div>

        <div className="ac-card p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-tertiary uppercase tracking-wider mb-2">Total Burn</p>
            <h3 className="text-2xl font-black">${metrics.total_cost.toFixed(3)}</h3>
            <div className="mt-2 text-xs text-secondary flex items-center gap-1">
              <TrendingUp size={12} className="text-accent" />
              Avg ${(metrics.total_cost / (metrics.total_tasks || 1)).toFixed(4)}/task
            </div>
          </div>
          <DollarSign className="text-success opacity-20" size={32} />
        </div>

        <div className="ac-card p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-tertiary uppercase tracking-wider mb-2">Reputation</p>
            <h3 className="text-2xl font-black">{metrics.reputation.toFixed(1)}</h3>
            <div className="mt-2 text-xs text-secondary flex items-center gap-1">
              <Star size={12} className="text-warning fill-current" />
              Elite status
            </div>
          </div>
          <Shield className="text-accent opacity-20" size={32} />
        </div>

        <div className="ac-card p-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-tertiary uppercase tracking-wider mb-2">Active Since</p>
            <h3 className="text-2xl font-black">2.4 days</h3>
            <div className="mt-2 text-xs text-secondary flex items-center gap-1">
              <Clock size={12} />
              Last seen 5m ago
            </div>
          </div>
          <Activity className="text-accent opacity-20" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: History */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-extrabold flex items-center gap-3">
               <History size={20} className="text-accent" />
               Recent Executions
             </h2>
             <button className="text-xs font-bold text-accent hover:underline">View All</button>
           </div>

           <div className="ac-card overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-secondary/50">
                 <tr>
                    <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">Task</th>
                    <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase tracking-wider">Date</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border-muted">
                 {history.map(t => (
                   <tr key={t.task_id} className="hover:bg-secondary/30 transition-colors">
                     <td className="px-6 py-4">
                        <div className="font-medium text-sm truncate max-w-[200px]">{t.payload}</div>
                        <div className="text-[10px] text-tertiary font-mono">{t.task_id.substring(0, 8)}</div>
                     </td>
                     <td className="px-6 py-4">
                        <div className={`px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                          t.status === 'completed' ? 'bg-success/10 text-success' : 
                          t.status === 'failed' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                        }`}>
                          {t.status === 'completed' ? <CheckCircle2 size={10} /> : t.status === 'failed' ? <XCircle size={10} /> : <Clock size={10} />}
                          {t.status.toUpperCase()}
                        </div>
                     </td>
                     <td className="px-6 py-4 font-mono text-xs">${t.cost.toFixed(4)}</td>
                     <td className="px-6 py-4 text-xs text-tertiary">
                        {new Date(t.created_at).toLocaleDateString()}
                     </td>
                   </tr>
                 ))}
                 {history.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-tertiary italic">No task history found</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Sidebar details */}
        <div className="space-y-8">
           <div>
             <h2 className="text-xl font-extrabold flex items-center gap-3 mb-6">
               <Database size={20} className="text-accent" />
               Agent Context
             </h2>
             <div className="ac-card p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase block mb-2">Memory Utilization</label>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent-primary" style={{ width: '42%' }} />
                  </div>
                  <div className="mt-2 text-xs text-secondary">4.2GB / 10GB allocated</div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-tertiary uppercase block mb-2">Internal Persona</label>
                  <div className="p-4 rounded-xl bg-tertiary text-xs text-secondary leading-relaxed italic border border-border-muted">
                    "This agent is configured with a high-precision reasoning engine tuned for architectural analysis and system design."
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-tertiary uppercase block">Active Scopes</label>
                  {['READ_MEMORY', 'WRITE_MEMORY', 'RUN_TASKS', 'SEND_PROTOCOL'].map(s => (
                    <div key={s} className="flex items-center gap-2 text-xs font-medium text-primary">
                       <CheckCircle2 size={12} className="text-success" />
                       {s}
                    </div>
                  ))}
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
