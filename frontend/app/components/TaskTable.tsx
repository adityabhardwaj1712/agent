"use client";
import React, { useState, useEffect } from 'react';
import { apiJson } from '../lib/api';
import { RefreshCw, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronRight, Hash, UserCircle } from 'lucide-react';

type Task = {
  task_id: string;
  agent_id?: string;
  status: string;
  result?: string | null;
  created_at?: string;
  thought_process?: string;
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  completed:  { color: "var(--accent-green)", icon: CheckCircle2, label: "SUCCESS_OK" },
  success:    { color: "var(--accent-green)", icon: CheckCircle2, label: "SUCCESS_OK" },
  failed:     { color: "var(--accent-red)", icon: XCircle, label: "FAILED_ERR" },
  error:      { color: "var(--accent-red)", icon: XCircle, label: "FAILED_ERR" },
  processing: { color: "var(--accent-primary)", icon: Loader2, label: "EXECUTING" },
  pending:    { color: "var(--accent-yellow)", icon: Clock, label: "QUEUED_WAIT" },
  queued:     { color: "var(--accent-cyan)", icon: Clock, label: "INITIALIZING" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || {
    color: "#94A3B8", icon: AlertTriangle, label: status?.toUpperCase() || "UNKNOWN"
  };
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.1em] transition-all duration-300" 
      style={{ 
        background: `${cfg.color}15`, 
        color: cfg.color, 
        border: `1px solid ${cfg.color}30`,
        boxShadow: `0 0 15px ${cfg.color}10`
      }}>
      <cfg.icon size={12} className={status?.toLowerCase() === 'processing' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  );
}

export default function TaskTable() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  async function loadTasks() {
    setLoading(true);
    try {
      const r = await apiJson<any>("/analytics/metrics");
      if (r.ok && r.data?.recent_tasks) {
        setTasks(r.data.recent_tasks);
      } else {
        setTasks([]);
      }
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }

  useEffect(() => { loadTasks(); }, []);

  const displayTasks = tasks.length > 0 ? tasks : [
    { task_id: "task-web-392", agent_id: "SearchBot", status: "completed", created_at: new Date().toISOString() },
    { task_id: "task-gen-104", agent_id: "Writer", status: "processing", created_at: new Date().toISOString() },
    { task_id: "task-anal-88", agent_id: "DataPro", status: "pending", created_at: new Date().toISOString() },
  ];

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-separate border-spacing-y-4 px-2">
        <thead>
          <tr className="text-tertiary text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mono">
            <th className="px-6 py-2">Mission_ID</th>
            <th className="px-6 py-2">Assigned_Entity</th>
            <th className="px-6 py-2">Execution_Status</th>
            <th className="px-6 py-2">Temporal_Stamp</th>
            <th className="px-6 py-2 text-right">Ops</th>
          </tr>
        </thead>
        <tbody>
          {displayTasks.map((task) => (
            <tr key={task.task_id} className="group glass-card hover:bg-white/[0.03] transition-all duration-500 rounded-3xl overflow-hidden relative">
              <td className="px-6 py-5 first:rounded-l-[2rem] border-y border-l border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary opacity-60 group-hover:opacity-100 transition-opacity">
                      <Hash size={12} />
                   </div>
                   <span className="font-mono text-[11px] font-semibold text-secondary group-hover:text-primary transition-colors tracking-tighter mono">
                    {task.task_id.substring(0, 12).toUpperCase()}
                   </span>
                </div>
              </td>
              <td className="px-6 py-5 border-y border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[1.25rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-500 border border-white/5 shadow-xl group-hover:scale-105 transition-transform">
                    <UserCircle size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-primary tracking-tight uppercase mono">{task.agent_id || "SYSTEM_DAEMON"}</span>
                    <span className="text-[9px] font-semibold text-tertiary uppercase tracking-widest opacity-60 mt-1 mono">ENTITY_CLASS_A</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 border-y border-white/5 bg-white/[0.01]">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-6 py-5 border-y border-white/5 text-[11px] font-black text-tertiary uppercase tracking-widest opacity-60 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                   <Clock size={12} className="opacity-40" />
                   {task.created_at ? new Date(task.created_at).toLocaleTimeString([], { hour12: false }) : "STAMP_NULL"}
                </div>
              </td>
              <td className="px-6 py-5 border-y border-r border-white/5 last:rounded-r-[2rem] text-right bg-white/[0.01]">
                <div className="flex items-center justify-end gap-2">
                   <button className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-indigo-500 hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-95 group/btn">
                    <RefreshCw size={16} className="group-hover/btn:rotate-180 transition-transform duration-700" />
                  </button>
                  <button className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-tertiary hover:bg-white/5 hover:text-primary transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
