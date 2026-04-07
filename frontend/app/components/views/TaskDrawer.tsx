'use client';

import React from 'react';

interface Task {
  id: string;
  name: string;
  agent: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  duration: string;
  priority: 'high' | 'medium' | 'low';
}

interface TaskDrawerProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskDrawer({ task, onClose }: TaskDrawerProps) {
  if (!task) return null;

  const pillCls = (s: string) => s === 'completed' ? 'pill-green' : s === 'running' ? 'pill-blue' : s === 'failed' ? 'pill-red' : 'pill-orange';
  const prioCls = (p: string) => p === 'high' ? 'priority-high' : p === 'medium' ? 'priority-med' : 'priority-low';

  // Seed some dummy rich data to make the drawer look good
  const dummyPayload = {
    action: 'Scan Data Lake',
    parameters: {
      depth: 3,
      filters: ['type:csv', 'size>1GB'],
      dry_run: false
    },
    timeout_ms: 30000
  };

  const dummyResult = task.status === 'completed' ? `[2026-04-06 12:45:11] Init: Success
[2026-04-06 12:45:14] Connect: Data Lake (Storage-2)
[2026-04-06 12:45:22] Scanning chunks... (45/45)
[2026-04-06 12:45:28] Found 14 matching entries.
[2026-04-06 12:45:30] Terminated: Clean.` : 
  task.status === 'failed' ? `[2026-04-06 12:45:11] Init: Success
[2026-04-06 12:45:14] Connect: Data Lake (Storage-2)
[2026-04-06 12:45:18] ERR: Connection Timeout (Error 504)` : 
  `Waiting for signals...`;

  return (
    <>
      <div className="drawer-overlay open" onClick={onClose}></div>
      <div className="drawer open">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{task.name}</div>
            <div className="drawer-sub">ID: <span style={{ fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{task.id}</span></div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        
        <div className="drawer-body">
          <div className="meta-grid">
            <div className="meta-item">
              <div className="meta-lbl">Status</div>
              <div className={`pill ${pillCls(task.status)}`}>{task.status.toUpperCase()}</div>
            </div>
            <div className="meta-item">
              <div className="meta-lbl">Agent</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)' }}>{task.agent}</div>
            </div>
            <div className="meta-item">
              <div className="meta-lbl">Priority</div>
              <div className={prioCls(task.priority)}>{task.priority.toUpperCase()}</div>
            </div>
            <div className="meta-item">
              <div className="meta-lbl">Duration</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)' }}>{task.duration}</div>
            </div>
            <div className="meta-item">
              <div className="meta-lbl">Cost</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--orange)' }}>$0.014</div>
            </div>
            <div className="meta-item">
              <div className="meta-lbl">Re-tries</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)' }}>0 / 3</div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="meta-lbl" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Task Payload</span>
              <span style={{ cursor: 'pointer', color: 'var(--blue)' }}>Copy</span>
            </div>
            <pre className="code-block">
              {JSON.stringify(dummyPayload, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="meta-lbl" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Execution Result {task.status === 'running' && '(Live)'}</span>
              <span style={{ cursor: 'pointer', color: 'var(--blue)' }}>Raw</span>
            </div>
            <pre className="code-block" style={{ borderLeft: `3px solid ${task.status === 'completed' ? 'var(--green)' : task.status === 'failed' ? 'var(--red)' : task.status === 'running' ? 'var(--blue)' : 'var(--border)'}`}}>
              {dummyResult}
            </pre>
          </div>
          
        </div>
        
        <div className="drawer-footer">
          {task.status === 'failed' && <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>Retry Task</button>}
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}
