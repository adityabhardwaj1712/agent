'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';
import AddTaskModal from './AddTaskModal';

export default function TaskTable() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await apiFetch<any[]>('/tasks');
      setTasks(data);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch tasks', 'err');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="ms-badge ms-b-g">Completed</span>;
      case 'failed': return <span className="ms-badge ms-b-r">Failed</span>;
      case 'pending': return <span className="ms-badge ms-b-y">Pending</span>;
      case 'in_progress': return <span className="ms-badge ms-b-b">In Progress</span>;
      default: return <span className="ms-badge ms-b-c">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="ms-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
         <div className="ms-dot ms-dot-y ms-dot-pulse" style={{ transform: 'scale(2)' }}></div>
      </div>
    );
  }

  return (
    <div className="ms-content">
      <div className="ms-card">
        <div className="ms-card-hd">
          <div className="ms-card-title">Task Execution History</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ms-btn ms-btn-g ms-btn-sm" onClick={fetchTasks}>↻ Refresh</button>
            <button className="ms-btn ms-btn-p ms-btn-sm" onClick={() => setIsModalOpen(true)}>+ New Task</button>
          </div>
        </div>
        <div className="ms-card-body" style={{ padding: 0 }}>
          <table className="ms-tbl">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--s-t3)' }}>
                    No tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.task_id}>
                    <td className="p" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                      {task.task_id.substring(0, 8)}...
                    </td>
                    <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.description}
                    </td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                      {new Date(task.created_at).toLocaleString()}
                    </td>
                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.result || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdded={fetchTasks} 
      />
    </div>
  );
}
