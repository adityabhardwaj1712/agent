'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch, getToken, clearToken } from '../lib/api';
import { usePolling } from '../lib/usePolling';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const NAV_ITEMS = [
  { section: 'Strategic Operations' },
  { id: 'dashboard',  icon: '⊞', label: 'Command Center' },
  { id: 'analytics',  icon: '📊', label: 'Signal Intelligence' },
  
  { section: 'Agent Fleet' },
  { id: 'fleet',      icon: '🤖', label: 'Autonomous Fleet', badgeKey: 'agents' },
  { id: 'monitoring', icon: '📈', label: 'Telemetry Stream' },
  { id: 'traces',     icon: '🔍', label: 'Neural Traces' },
  
  { section: 'Mission Control' },
  { id: 'workflows',  icon: '🚀', label: 'Workflows' },
  { id: 'tasks',      icon: '📋', label: 'Active Missions', badgeKey: 'tasks' },
  
  { section: 'Security & Intel' },
  { id: 'memory',     icon: '🧠', label: 'Vector Memory' },
  { id: 'knowledge',  icon: '📚', label: 'Knowledge Hub' },
  { id: 'audit',      icon: '🛡️', label: 'Admin Audit' },
  { id: 'marketplace',icon: '🛒', label: 'Marketplace' },
  { id: 'protocol',   icon: '🔌', label: 'Global Tools' },
  { id: 'settings',   icon: '⚙', label: 'System Control' },
];

export default function Sidebar({ activeView, onViewChange, theme, onToggleTheme }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [systemHealth, setSystemHealth] = useState<string>('checking');
  const [agentCount, setAgentCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  const fetchHealth = async () => {
    try {
      const data = await apiFetch<any>('/analytics/summary');
      if (data) {
        setSystemHealth('healthy');
        setAgentCount(data.active_agents ?? 0);
        setTaskCount(data.active_events ?? 0);
      }
    } catch {
      setSystemHealth('degraded');
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn("Backend logout failed, clearing local session anyway", e);
    }
    clearToken();
    window.location.href = '/login';
  };

  usePolling(fetchHealth, 15000);

  useEffect(() => {
    if (getToken()) {
      fetchHealth();
    }
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

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q) return;
    const ql = q.toLowerCase();
    const navMap: Record<string, string[]> = {
      dashboard: ['dash', 'home', 'main', 'overview', 'command'],
      fleet: ['agent', 'fleet', 'worker', 'core', 'auto'],
      tasks: ['task', 'queue', 'job', 'mission'],
      workflows: ['workflow', 'pipe', 'pipeline'],
      monitoring: ['monitor', 'metric', 'cpu', 'mem', 'health', 'telemetry'],
      analytics: ['analytics', 'chart', 'throughput', 'intel', 'signal'],
      traces: ['trace', 'span', 'request', 'neural'],
      settings: ['settings', 'config', 'security', 'control'],
    };
    for (const [view, keywords] of Object.entries(navMap)) {
      if (keywords.some(k => k.includes(ql) || ql.includes(k))) {
        onViewChange(view);
        break;
      }
    }
  };

  return (
    <aside className="sidebar terminal-flicker">
      <div className="scanline"></div>
      
      {/* Tactical Logo */}
      <div className="logo">
        <div className="logo-orb" style={{
          background: 'linear-gradient(135deg, var(--cyan), var(--blue))',
          boxShadow: 'var(--glow)'
        }}>
          🛰️
        </div>
        <div className="logo-text" style={{ 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          fontWeight: 900
        }}>
          Agent<span style={{ color: 'var(--cyan)' }}>Cloud</span>
        </div>
      </div>

      {/* Global Search */}
      <div className="sb-search" style={{ margin: '15px' }}>
        <span style={{ color: 'var(--cyan)', opacity: 0.6 }}>❯</span>
        <input
          type="text"
          placeholder="SEARCH SECTORS..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}
        />
      </div>

      {/* Navigation Grid */}
      <nav className="nav">
        {filteredItems.map((item, i) => {
          if ('section' in item && !item.id) {
            return (
              <div key={`sec-${i}`} className="nav-section" style={{
                color: 'var(--cyan)',
                opacity: 0.4,
                padding: '20px 20px 8px'
              }}>
                {item.section}
              </div>
            );
          }

          const badge = getBadge((item as any).badgeKey);

          return (
            <div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => item.id && onViewChange(item.id)}
              style={{
                border: activeView === item.id ? '1px solid var(--border2)' : '1px solid transparent',
                borderRadius: '4px',
                margin: '2px 12px'
              }}
            >
              <span className="nav-icon" style={{ 
                color: activeView === item.id ? 'var(--cyan)' : 'var(--t2)',
                filter: activeView === item.id ? 'drop-shadow(var(--glow))' : 'none'
              }}>
                {item.icon}
              </span>
              <span style={{ 
                fontSize: '11px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px' 
              }}>
                {item.label}
              </span>
              {badge !== null && (
                <span className="nav-badge" style={{
                  background: 'rgba(0, 242, 255, 0.15)',
                  color: 'var(--cyan)',
                  border: '1px solid var(--border2)'
                }}>
                  {badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="sys-status" style={{ padding: '4px 0' }}>
          <div className="sys-dot" style={{
            background: systemHealth === 'healthy' ? 'var(--cyan)' :
                         systemHealth === 'degraded' ? 'var(--red)' : 'var(--t3)',
            boxShadow: systemHealth === 'healthy' ? '0 0 10px var(--cyan)' : 'none'
          }} />
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
            {systemHealth === 'healthy' ? 'ALL SYSTEMS NOMINAL' :
             systemHealth === 'degraded' ? 'SYSTEM DEGRADED' : 'INITIALIZING...'}
          </span>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '9px', color: 'var(--t3)', fontFamily: 'var(--mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>SECURE ENCRYPTED NODE: {Math.random().toString(16).substring(2, 10).toUpperCase()}</span>
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'rgba(255, 0, 0, 0.1)', 
              color: 'var(--red)', 
              border: '1px solid rgba(255, 0, 0, 0.3)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}
            className="hover:bg-[var(--red)] hover:text-white transition-all"
          >
            [ TERMINATE_SESSION ]
          </button>
        </div>
      </div>
    </aside>
  );
}
