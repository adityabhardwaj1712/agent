'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch, getToken } from '../lib/api';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const NAV_ITEMS = [
  { section: 'Main' },
  { id: 'fleet',      icon: '⊞', label: 'Dashboard' },
  { id: 'agents',     icon: '🤖', label: 'Agent Fleet', badgeKey: 'agents' },
  { id: 'monitoring', icon: '📈', label: 'Monitoring' },
  { id: 'tasks',      icon: '📋', label: 'Tasks', badgeKey: 'tasks' },
  { id: 'workflow',   icon: '🚀', label: 'Workflows' },
  { section: 'AI' },
  { id: 'playground', icon: '🧪', label: 'Playground' },
  { id: 'memory',     icon: '🧠', label: 'Memory' },
  { id: 'knowledge',  icon: '📚', label: 'Knowledge Hub' },
  { section: 'Operations' },
  { id: 'protocol',   icon: '📡', label: 'Protocol' },
  { id: 'traces',     icon: '🔍', label: 'Traces' },
  { id: 'approvals',  icon: '🛡', label: 'Approvals' },
  { id: 'audit',      icon: '📝', label: 'Audit Log' },
  { section: 'System' },
  { id: 'marketplace', icon: '🏪', label: 'Marketplace' },
  { id: 'billing',    icon: '💳', label: 'Billing' },
  { id: 'autonomous', icon: '🎯', label: 'Mission Control' },
  { id: 'settings',   icon: '⚙', label: 'Settings' },
];

export default function Sidebar({ activeView, onViewChange, theme, onToggleTheme }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [systemHealth, setSystemHealth] = useState<string>('checking');
  const [agentCount, setAgentCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchHealth = async () => {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        if (mounted && data) {
          setSystemHealth('healthy');
          setAgentCount(data.active_agents ?? 0);
          setTaskCount(data.active_events ?? 0);
        }
      } catch {
        if (mounted) setSystemHealth('degraded');
      }
    };

    if (getToken()) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 15000);
      return () => { mounted = false; clearInterval(interval); };
    }

    return () => { mounted = false; };
  }, []);

  const filteredItems = NAV_ITEMS.filter(item => {
    if ('section' in item && !item.id) return true;
    if (!searchQuery) return true;
    return item.label?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getBadge = (key?: string) => {
    if (key === 'agents' && agentCount > 0) return agentCount;
    if (key === 'tasks' && taskCount > 0) return taskCount;
    return null;
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="logo">
        <div className="logo-orb">⚡</div>
        <div className="logo-text">Agent<span>Cloud</span></div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <span style={{ color: 'var(--t3)', fontSize: '11px' }}>⌕</span>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Navigation */}
      <nav className="nav">
        {filteredItems.map((item, i) => {
          if ('section' in item && !item.id) {
            return <div key={`sec-${i}`} className="nav-section">{item.section}</div>;
          }

          const badge = getBadge((item as any).badgeKey);

          return (
            <div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => item.id && onViewChange(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {badge !== null && (
                <span className="nav-badge">{badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sys-status">
          <div className="sys-dot" style={{
            background: systemHealth === 'healthy' ? 'var(--cyan)' :
                         systemHealth === 'degraded' ? 'var(--orange)' : 'var(--t3)'
          }} />
          {systemHealth === 'healthy' ? 'All Systems Healthy' :
           systemHealth === 'degraded' ? 'System Degraded' : 'Checking...'}
        </div>
      </div>
    </div>
  );
}
