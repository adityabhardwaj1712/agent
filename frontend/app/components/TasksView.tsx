'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

/* ═══════════════════════════════════════════════════
   TASKS VIEW — Task Queue & Table
═══════════════════════════════════════════════════ */

interface Task {
  id: string;
  name: string;
  agent: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  duration: string;
  priority: 'high' | 'medium' | 'low';
}

function seedTasks(): Task[] {
  const names = ['Data Ingestion Pipeline', 'Model Training Batch #4', 'Log Aggregation Sweep', 'Cache Invalidation', 'Shard Rebalancing', 'Index Rebuild (Shard 4)', 'Health Check Broadcast', 'Anomaly Detection Scan', 'Backup Snapshot', 'Certificate Rotation', 'Vector Embedding Update', 'Policy Sync'];
  const agents = ['Worker-12', 'Worker-05', 'Worker-31', 'Worker-08', 'Worker-22', 'Worker-19', 'Core-A', 'Worker-44', 'Data-Lake', 'Core-B', 'Worker-17', 'Worker-03'];
  const statuses: Task['status'][] = ['running', 'running', 'completed', 'completed', 'failed', 'queued', 'running', 'queued', 'completed', 'running', 'queued', 'completed'];
  const priorities: Task['priority'][] = ['high', 'high', 'medium', 'low', 'high', 'medium', 'low', 'medium', 'high', 'medium', 'low', 'medium'];
  return names.map((n, i) => ({
    id: `T-${String(i + 1).padStart(3, '0')}`,
    name: n,
    agent: agents[i],
    status: statuses[i],
    progress: statuses[i] === 'completed' ? 100 : statuses[i] === 'failed' ? Math.floor(Math.random() * 90) + 5 : statuses[i] === 'running' ? Math.floor(Math.random() * 90) + 5 : 0,
    duration: statuses[i] === 'queued' ? '--' : Math.floor(Math.random() * 600) + 's',
    priority: priorities[i],
  }));
}

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('All');

  const cancelTask = async (id: string, e: any) => {
    e.stopPropagation();
    try {
      await apiFetch(`/tasks/${id}/cancel`, { method: 'POST' });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'failed' } : t)); // using failed or cancelled style
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<any[]>('/tasks/?limit=50');
        if (data && data.length > 0) {
          setTasks(data.map((t: any, i: number) => ({
            id: t.task_id?.slice(0, 7) || `T-${String(i + 1).padStart(3, '0')}`,
            name: t.payload?.slice(0, 40) || t.name || 'Task',
            agent: t.agent_id?.slice(0, 10) || 'Auto',
            status: t.status === 'completed' ? 'completed' : t.status === 'failed' ? 'failed' : t.status === 'running' ? 'running' : 'queued',
            progress: t.status === 'completed' ? 100 : t.status === 'failed' ? 45 : t.status === 'running' ? Math.floor(Math.random() * 80) + 10 : 0,
            duration: t.duration || '--',
            priority: t.priority || 'medium',
          })));
        } else {
          setTasks(seedTasks());
        }
      } catch {
        setTasks(seedTasks());
      }
    };
    load();
  }, []);

  const counts = { running: 0, completed: 0, failed: 0, queued: 0 };
  tasks.forEach(t => { counts[t.status]++; });

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter.toLowerCase());

  const pillCls = (s: string) => s === 'completed' ? 'pill-green' : s === 'running' ? 'pill-blue' : s === 'failed' ? 'pill-red' : 'pill-orange';
  const progressColor = (s: string) => s === 'completed' ? 'var(--green)' : s === 'failed' ? 'var(--red)' : s === 'running' ? 'var(--blue)' : 'var(--t3)';
  const prioCls = (p: string) => p === 'high' ? 'priority-high' : p === 'medium' ? 'priority-med' : 'priority-low';

  return (
    <div className="view-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="pg-title">Task Queue</h1>
          <div className="pg-sub">Manage and monitor agent task execution</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => (window as any).openAddTask?.()}>
          + Create Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Running', val: counts.running, color: 'var(--blue)' },
          { label: 'Completed', val: counts.completed, color: 'var(--green)' },
          { label: 'Failed', val: counts.failed, color: 'var(--red)' },
          { label: 'Queued', val: counts.queued, color: 'var(--orange)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Task Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {['All', 'Running', 'Completed', 'Failed', 'Queued'].map(f => (
            <button key={f}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Task ID</th><th>Name</th><th>Agent</th><th>Status</th>
              <th>Progress</th><th>Duration</th><th>Priority</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td><span className="task-id">{t.id}</span></td>
                <td><span className="task-name">{t.name}</span></td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>{t.agent}</td>
                <td><span className={`pill ${pillCls(t.status)}`}>{t.status}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${t.progress}%`, background: progressColor(t.status) }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>{t.progress}%</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{t.duration}</td>
                <td><span className={prioCls(t.priority)}>{t.priority.toUpperCase()}</span></td>
                <td>
                  {(t.status === 'running' || t.status === 'queued') && <button className="btn btn-ghost btn-sm btn-icon" title="Cancel Task" onClick={(e) => cancelTask(t.id, e)}>⏹</button>}
                  {t.status === 'failed' && <button className="btn btn-ghost btn-sm btn-icon" title="Retry">↻</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
