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
  MoreVertical,
  Cpu,
  Fingerprint,
  Zap,
  Layers,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Globe,
  Settings,
  Lock,
  Unlock,
  Radio
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
       <div className="relative">
          <Activity size={48} className="text-indigo-500/20" />
          <Loader2 size={48} className="absolute inset-0 text-indigo-500 animate-spin" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-tertiary animate-pulse">Synchronizing_Neural_Profile...</p>
    </div>
  );

  if (!metrics) return (
    <div className="max-w-lg mx-auto py-32 text-center space-y-10 animate-slide-in">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-primary tracking-tighter uppercase whitespace-pre">AGENT_NOT_FOUND</h1>
        <p className="text-secondary text-sm">The requested neural entity does not exist in the current grid.</p>
      </div>
      <Link href="/agents" className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20">
        Return to Command Center
      </Link>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto animate-slide-in p-4 md:p-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link href="/agents" className="w-14 h-14 bg-tertiary/5 border border-white/5 rounded-2xl flex items-center justify-center text-tertiary hover:bg-tertiary/10 hover:text-primary transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                NEURAL_ENTITY_PROFILE
              </span>
              <span className="flex items-center gap-2 text-[10px] font-mono text-tertiary uppercase tracking-widest opacity-60">
                <Fingerprint size={12} className="text-indigo-500" />
                {agentId.substring(0, 16)}...
              </span>
            </div>
            <h1 className="text-4xl font-black text-primary tracking-tighter">{metrics.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex-1 md:flex-none px-8 py-4 bg-tertiary/5 border border-white/5 rounded-2xl text-[11px] font-black tracking-widest text-tertiary uppercase hover:bg-tertiary/10 hover:text-primary transition-all">
            Edit_Pulse
          </button>
          <button className="flex-1 md:flex-none px-8 py-4 bg-indigo-500 text-white rounded-2xl text-[11px] font-black tracking-widest uppercase hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20">
            Dispatch_Mission
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Success Rate', value: `${metrics.success_rate.toFixed(1)}%`, sub: `${metrics.total_tasks} missions`, icon: <CheckCircle2 size={24} className="text-green-500" /> },
          { label: 'Total Burn', value: `$${metrics.total_cost.toFixed(3)}`, sub: `$${(metrics.total_cost / (metrics.total_tasks || 1)).toFixed(4)} avg`, icon: <DollarSign size={24} className="text-indigo-500" /> },
          { label: 'Reputation', value: metrics.reputation.toFixed(1), sub: 'High Fidelity', icon: <Star size={24} className="text-amber-500" /> },
          { label: 'Neural Age', value: '2.4 Days', sub: 'Active Pulse', icon: <Cpu size={24} className="text-purple-500" /> }
        ].map((card, idx) => (
          <div key={idx} className="glass-card p-8 rounded-[2rem] border border-white/5 flex justify-between items-start group hover:border-white/10 transition-all duration-500">
            <div className="space-y-4">
              <p className="text-[9px] font-black text-tertiary/50 uppercase tracking-[0.2em]">{card.label}</p>
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-primary tracking-tighter">{card.value}</h3>
                <p className="text-[10px] font-black text-tertiary uppercase tracking-widest">{card.sub}</p>
              </div>
            </div>
            <div className="w-14 h-14 bg-tertiary/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: History */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <History size={20} />
               </div>
               <h2 className="text-xl font-black text-primary uppercase tracking-tight">Mission_Log</h2>
             </div>
             <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">
               ACCESS_ARCHIVES
             </button>
           </div>

           <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-bottom border-white/5">
                      <th className="px-8 py-6 text-[10px] font-black text-tertiary uppercase tracking-[0.2em]">Objective</th>
                      <th className="px-8 py-6 text-[10px] font-black text-tertiary uppercase tracking-[0.2em]">State</th>
                      <th className="px-8 py-6 text-[10px] font-black text-tertiary uppercase tracking-[0.2em]">Energy</th>
                      <th className="px-8 py-6 text-[10px] font-black text-tertiary uppercase tracking-[0.2em]">Temporal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map(t => (
                      <tr key={t.task_id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-8">
                           <div className="space-y-1.5">
                              <div className="font-black text-[13px] text-primary max-w-[280px] overflow-hidden text-overflow-ellipsis whitespace-nowrap uppercase tracking-tight group-hover:text-indigo-500 transition-colors">
                                {t.payload}
                              </div>
                              <div className="flex items-center gap-2 text-[9px] font-black text-tertiary uppercase tracking-widest opacity-40">
                                <Radio size={10} className="text-indigo-500" />
                                HEX_{t.task_id.substring(0, 12)}
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              t.status === 'completed' 
                                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                : t.status === 'failed' 
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                           }`}>
                             <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                t.status === 'completed' ? 'bg-green-500' : t.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                             }`} />
                             {t.status}
                           </span>
                        </td>
                        <td className="px-8 py-8 font-mono text-[11px] text-secondary tracking-tighter">
                          ${t.cost.toFixed(4)}
                        </td>
                        <td className="px-8 py-8 text-[11px] font-black text-tertiary uppercase tracking-normal opacity-60">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-[11px] font-black text-tertiary uppercase tracking-[0.3em] bg-white/[0.01]">
                           Registers_Empty_In_This_Sector
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Sidebar details */}
        <div className="space-y-8">
           <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-10 shadow-2xl">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Database size={20} />
               </div>
               <h2 className="text-xl font-black text-primary uppercase tracking-tight">Neural_Context</h2>
             </div>
             
             <div className="space-y-4">
               <div className="flex justify-between items-end">
                 <label className="text-[9px] font-black text-tertiary uppercase tracking-[0.2em]">MEM_ASYNC_LOAD</label>
                 <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">42%</span>
               </div>
               <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[2px]">
                 <div className="h-full w-[42%] bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               </div>
             </div>

             <div className="space-y-4">
                <label className="text-[9px] font-black text-tertiary uppercase tracking-[0.2em]">IDENTITY_CORE</label>
                <div className="p-6 bg-black/20 border border-white/5 rounded-2xl text-[11px] text-secondary leading-relaxed font-mono relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Cpu size={32} />
                   </div>
                   "High-precision reasoning engine tuned for architectural analysis and mission-critical system design."
                </div>
             </div>

             <div className="space-y-6">
                <label className="text-[9px] font-black text-tertiary uppercase tracking-[0.2em]">ACTIVE_PERMISSIONS</label>
                <div className="grid gap-3">
                  {['READ_MEMORY', 'WRITE_MEMORY', 'RUN_TASKS', 'SEND_PROTOCOL'].map(s => (
                    <div key={s} className="flex items-center justify-between p-4 bg-tertiary/5 border border-white/5 rounded-xl group hover:border-indigo-500/30 transition-all cursor-default">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={14} className="text-green-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-black text-secondary tracking-widest group-hover:text-primary transition-colors">{s}</span>
                      </div>
                      <ChevronRight size={12} className="text-tertiary group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
                </div>
             </div>
           </div>

           <div className="relative group overflow-hidden p-10 rounded-[3rem] border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 space-y-8 text-center">
                <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-500/50 group-hover:scale-110 transition-transform duration-700">
                   <Zap size={32} />
                </div>
                <div className="space-y-4">
                  <h4 className="text-xl font-black text-primary uppercase tracking-tight">AUTONOMOUS_MODE</h4>
                  <p className="text-[11px] text-secondary leading-relaxed font-medium">
                    Allow this agent to execute mission sequences without manual human-in-the-loop triggers.
                  </p>
                </div>
                <button className="w-full py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-colors shadow-2xl">
                  ACTIVATE_SENTRY
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* Visual background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5 z-[-1]">
         <div className="absolute top-[20%] left-[5%] w-[40rem] h-[40rem] bg-indigo-500 rounded-full filter blur-[150px]" />
         <div className="absolute bottom-[20%] right-[5%] w-[30rem] h-[30rem] bg-indigo-600 rounded-full filter blur-[120px]" />
      </div>
    </div>
  );
}
  );
}
