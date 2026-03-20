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
              <th style={{ width: '40px' }}><input type="checkbox" style={{ accentColor: 'var(--accent-primary)' }} /></th>
              <th>Task ID</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Last Event</th>
            </tr>
          </thead>
          <tbody>
            {TASKS.map((task) => (
              <tr key={task.id} style={{ transition: 'background 0.2s ease' }}>
                <td><input type="checkbox" style={{ accentColor: 'var(--accent-primary)' }} /></td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {task.id}
                </td>
                <td>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.color }}></div>
                      {task.agent}
                   </div>
                </td>
                <td>
                  <span className="ac-status-pill" style={{ 
                    background: `${task.color}15`, 
                    color: task.color, 
                    border: `1px solid ${task.color}30`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: task.color }}></span>
                    {task.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{task.duration}</td>
                <td>{task.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
