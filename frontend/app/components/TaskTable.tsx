'use client';

import React from 'react';
import { Checkbox } from 'lucide-react'; // Placeholder for actual checkbox

const TASKS = [
  { id: '1234572080', agent: 'Research Agent', status: 'Status', duration: '32 mintes', last: 'Jan 7, 3:32 PM', color: 'var(--accent-primary)' },
  { id: '1234572002', agent: 'Data Analyst', status: 'Warning', duration: '35 mintes', last: 'Sep 7, 3:32 PM', color: 'var(--accent-warning)' },
  { id: '1234572063', agent: 'Editor', status: 'Critical', duration: '55m ago', last: 'Jan 7, 3:25 PM', color: 'var(--accent-danger)' },
];

export default function TaskTable() {
  return (
    <div className="ac-widget">
      <div className="ac-widget-title">
        <span>Active Agent Tasks</span>
        <button className="ac-header-btn" style={{ height: '32px', padding: '0 12px', fontSize: '12px', width: 'auto', gap: '8px' }}>
          Sort by
        </button>
      </div>
      
      <div className="ac-table-container">
        <table className="ac-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" /></th>
              <th>Task ID</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Last Event</th>
            </tr>
          </thead>
          <tbody>
            {TASKS.map((task) => (
              <tr key={task.id}>
                <td><input type="checkbox" /></td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.id}</td>
                <td>{task.agent}</td>
                <td>
                  <span className="ac-status-pill" style={{ background: `${task.color}15`, color: task.color, border: `1px solid ${task.color}30` }}>
                    {task.status}
                  </span>
                </td>
                <td>{task.duration}</td>
                <td>{task.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
