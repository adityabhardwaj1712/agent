'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  LayoutDashboard, Bot, Zap, ListTodo, Settings, Search,
  Activity, FileText, ChevronDown, ChevronRight, Server,
  ScrollText, Workflow, CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [search, setSearch] = useState('');
  const [fleetOpen, setFleetOpen] = useState(true);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'offline'>('healthy');
  const [agentCount, setAgentCount] = useState(0);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        if (data) {
          setAgentCount(data.active_agents || 0);
          setSystemHealth(data.success_rate >= 90 ? 'healthy' : 'degraded');
        }
      } catch {
        setSystemHealth('offline');
      }
    };
    fetchHealth();
    const iv = setInterval(fetchHealth, 15000);
    return () => clearInterval(iv);
  }, []);

  const mainNav = [
    { id: 'fleet', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const fleetSub = [
    { id: 'agents', label: 'Active Agents' },
    { id: 'traces', label: 'Agent Logs' },
    { id: 'autonomous', label: 'Deployment' },
  ];

  const secondaryNav = [
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'workflow', label: 'Workflows', icon: Workflow },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isFleetChild = fleetSub.some(s => s.id === activeView);

  return (
    <aside className="ms-sb-wide">
      {/* Logo */}
      <div className="ms-logo-wide">
        <div className="ms-logo-mark">AC</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ms-logo-name">AgentCloud</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="fi"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', paddingLeft: 32, height: 34, fontSize: 12,
              background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 8
            }}
          />
        </div>
      </div>

      <nav className="ms-nav-wide">
        {/* Dashboard */}
        {mainNav.map(item => (
          <div
            key={item.id}
            className={`ms-nav-itm ${activeView === item.id ? 'act' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon size={18} style={{ opacity: 0.7 }} />
            <span className="flex-1">{item.label}</span>
          </div>
        ))}

        {/* Agent Fleet - Expandable */}
        <div
          className={`ms-nav-itm ${isFleetChild ? 'act' : ''}`}
          onClick={() => setFleetOpen(!fleetOpen)}
          style={{ cursor: 'pointer' }}
        >
          <Bot size={18} style={{ opacity: 0.7 }} />
          <span className="flex-1">Agent Fleet</span>
          {fleetOpen ? <ChevronDown size={14} style={{ opacity: 0.4 }} /> : <ChevronRight size={14} style={{ opacity: 0.4 }} />}
        </div>
        
        {fleetOpen && (
          <div style={{ paddingLeft: 20 }}>
            {fleetSub.map(sub => (
              <div
                key={sub.id}
                className={`ms-nav-itm ${activeView === sub.id ? 'act' : ''}`}
                onClick={() => onViewChange(sub.id)}
                style={{ fontSize: 12, padding: '8px 14px' }}
              >
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: activeView === sub.id ? 'var(--cyan)' : 'var(--t3)', flexShrink: 0 }} />
                <span>{sub.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Secondary Nav */}
        {secondaryNav.map(item => (
          <div
            key={item.id}
            className={`ms-nav-itm ${activeView === item.id ? 'act' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon size={18} style={{ opacity: 0.7 }} />
            <span className="flex-1">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* System Health Footer */}
      <div className="ms-sb-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <div style={{ 
            width: 8, height: 8, borderRadius: '50%', 
            background: systemHealth === 'healthy' ? 'var(--green)' : systemHealth === 'degraded' ? 'var(--amber)' : 'var(--red)',
            boxShadow: systemHealth === 'healthy' ? '0 0 8px var(--green)' : 'none'
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {systemHealth === 'healthy' ? 'System Healthy' : systemHealth === 'degraded' ? 'System Degraded' : 'System Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
