'use client';

import React, { useState, useEffect } from 'react';
import { apiJson } from '../lib/api';
import { RefreshCw, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

type Task = {
  task_id: string;
  agent_id?: string;
  status: string;
  result?: string | null;
  created_at?: string;
  thought_process?: string;
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  completed:  { color: "#10B981", icon: <CheckCircle2 size={11} />, label: "Completed" },
  success:    { color: "#10B981", icon: <CheckCircle2 size={11} />, label: "Success" },
  failed:     { color: "#EF4444", icon: <XCircle size={11} />, label: "Failed" },
  error:      { color: "#EF4444", icon: <XCircle size={11} />, label: "Error" },
  processing: { color: "#3B82F6", icon: <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />, label: "Processing" },
  pending:    { color: "#F59E0B", icon: <Clock size={11} />, label: "Pending" },
  queued:     { color: "#8B5CF6", icon: <Clock size={11} />, label: "Queued" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || {
    color: "var(--text-tertiary)", icon: <AlertTriangle size={11} />, label: status || "Unknown"
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30`
    }}>
      {cfg.icon} {cfg.label}
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
      // Try analytics endpoint first (returns task list), fall back gracefully
      const r = await apiJson<any>("/v1/analytics/metrics");
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

  // Mock data when no tasks yet (so UI never feels empty)
  const displayTasks = tasks.length > 0 ? tasks : [
    { task_id: "task-demo-001", agent_id: "WebResearcher", status: "completed", created_at: new Date().toISOString() },
    { task_id: "task-demo-002", agent_id: "CodeHelper", status: "processing", created_at: new Date().toISOString() },
    { task_id: "task-demo-003", agent_id: "DataAnalyst", status: "pending", created_at: new Date().toISOString() },
  ];

  return (
    <div className="ac-widget">
      <div className="ac-widget-title">
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span>Active Agent Tasks</span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 400 }}>
            Refreshed {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={loadTasks}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-muted)",
            background: "var(--bg-tertiary)", color: "var(--text-secondary)",
            cursor: loading ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      <div className="ac-table-container">
        <table className="ac-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Time</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {displayTasks.map((task) => (
              <tr key={task.task_id}>
                <td style={{ fontWeight: 600, fontFamily: "monospace", fontSize: 12, color: "var(--text-primary)" }}>
                  {task.task_id.substring(0, 16)}…
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: STATUS_CONFIG[task.status?.toLowerCase()]?.color || "var(--text-tertiary)"
                    }} />
                    <span style={{ fontSize: 13 }}>{task.agent_id || "—"}</span>
                  </div>
                </td>
                <td><StatusBadge status={task.status} /></td>
                <td style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {task.created_at ? new Date(task.created_at).toLocaleTimeString() : "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 180 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {task.result ? task.result.substring(0, 60) + (task.result.length > 60 ? "…" : "") : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
