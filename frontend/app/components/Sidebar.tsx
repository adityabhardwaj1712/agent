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
  { id: 'dashboard',  icon: '⊞', label: 'Dashboard' },
  { id: 'fleet',      icon: '🤖', label: 'Agent Fleet', badgeKey: 'agents' },
  { id: 'monitoring', icon: '📈', label: 'Monitoring' },
  { id: 'tasks',      icon: '📋', label: 'Tasks', badgeKey: 'tasks' },
  { id: 'workflows',  icon: '🚀', label: 'Workflows' },
  { section: 'AI' },
  { id: 'analytics',  icon: '📊', label: 'Analytics' },
  { id: 'traces',     icon: '🔍', label: 'Traces' },
  { section: 'System' },
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

  // Search-based navigation
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q) return;
    const ql = q.toLowerCase();
    const navMap: Record<string, string[]> = {
      dashboard: ['dash', 'home', 'main', 'overview'],
      fleet: ['agent', 'fleet', 'worker', 'core'],
      tasks: ['task', 'queue', 'job'],
      workflows: ['workflow', 'pipe', 'pipeline'],
      monitoring: ['monitor', 'metric', 'cpu', 'mem', 'health'],
      analytics: ['analytics', 'chart', 'throughput'],
      traces: ['trace', 'span', 'request'],
      settings: ['settings', 'config', 'security'],
    };
    for (const [view, keywords] of Object.entries(navMap)) {
      if (keywords.some(k => k.includes(ql) || ql.includes(k))) {
        onViewChange(view);
        break;
      }
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo">
        <div className="logo-orb">⚡</div>
        <div className="logo-text">Agent<span>Cloud</span></div>
      </div>

      {/* Search */}
      <div className="sb-search">
        <span style={{ color: 'var(--t3)', fontSize: '11px' }}>⌕</span>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
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
      <div className="sb-footer">
        <div className="sys-status">
          <div className="sys-dot" style={{
            background: systemHealth === 'healthy' ? 'var(--cyan)' :
                         systemHealth === 'degraded' ? 'var(--orange)' : 'var(--t3)'
          }} />
          {systemHealth === 'healthy' ? 'System Healthy' :
           systemHealth === 'degraded' ? 'System Degraded' : 'Checking...'}
        </div>
      </div>
    </aside>
  );
}
