'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export default function TaskTable() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await apiFetch<any[]>('/tasks');
        setTasks(data || []);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return <div className="p-8 mono text-t3 animate-pulse">Syncing Task Registry...</div>;

  return (
    <div className="tbl-wrap">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Description</th>
            <th>Agent</th>
            <th>Priority</th>
            <th>Status</th>
            <th className="text-right">Created</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-t3 mono">No tasks recorded in history.</td></tr>}
          {tasks.map((t, i) => {
            const status = t.status || 'pending';
            const priority = (t.priority_level > 7 ? 'high' : t.priority_level > 4 ? 'medium' : 'low');
            const sbc = {completed:'b-g',running:'b-a',pending:'b-y',queued:'b-y',failed:'b-r'}[status as string] || 'b-t3';
            const pbc = {high:'b-r',medium:'b-y',low:'b-g',critical:'b-p'}[priority as string] || 'b-t2';
            
            return (
              <tr key={i}>
                <td className="mono-sm text-t1 font-bold">{t.task_id.split('-')[0]}...</td>
                <td className="max-w-[200px] truncate text-[12px]">{t.payload}</td>
                <td className="text-[11.5px] text-t2">{t.agent_id || 'Auto'}</td>
                <td><span className={`badge ${pbc}`}>{priority.toUpperCase()}</span></td>
                <td><span className={`badge ${sbc}`}>{status.toUpperCase()}</span></td>
                <td className="mono-sm text-right text-t3">{new Date(t.created_at).toLocaleTimeString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
