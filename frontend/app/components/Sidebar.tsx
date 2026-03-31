'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch, wsUrl } from '../lib/api';
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
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        if (data) {
          setAgentCount(data.active_agents || 0);
          setPendingApprovals(data.pending_approvals || 0);
          setSystemHealth(data.success_rate >= 90 ? 'healthy' : 'degraded');
        }
      } catch {
        setSystemHealth('offline');
      }
    };
    
    fetchHealth();
    
    // Real-time telemetry link
    const ws = new WebSocket(wsUrl('/fleet'));
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.active_agents !== undefined) setAgentCount(data.active_agents);
        if (data.pending_approvals !== undefined) setPendingApprovals(data.pending_approvals);
        if (data.success_rate !== undefined) setSystemHealth(data.success_rate >= 90 ? 'healthy' : 'degraded');
      } catch (e) {
        console.error("Sidebar WS Error", e);
      }
    };
    
    return () => ws.close();
  }, []);

  const mainNav = [
    { id: 'fleet', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const fleetSub = [
    { id: 'agents', label: 'Active Agents', badge: agentCount > 0 ? agentCount : null },
    { id: 'traces', label: 'Agent Logs' },
    { id: 'autonomous', label: 'Deployment' },
  ];

  const secondaryNav = [
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: ListTodo, badge: pendingApprovals > 0 ? pendingApprovals : null },
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
          <div className="ms-logo-ver">PRO_EDITION</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            className="fi"
            placeholder="Quick command..."
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
                <span className="flex-1">{sub.label}</span>
                {sub.badge && <span className="ms-nav-badge y">{sub.badge}</span>}
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
            {item.badge && <span className="ms-nav-badge">{item.badge}</span>}
          </div>
        ))}
      </nav>

      {/* System Health Footer */}
      <div className="ms-sb-footer" style={{ padding: '16px 20px' }}>
        <div className="flex items-center gap-3 w-full p-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border)]">
          <div className={`ms-dot ms-dot-${systemHealth === 'healthy' ? 'g' : systemHealth === 'degraded' ? 'y' : 'r'} ${systemHealth === 'healthy' ? 'animate-pulse' : ''}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white leading-tight">
              {systemHealth === 'healthy' ? 'NODE_STABLE' : systemHealth === 'degraded' ? 'NODE_DEGRADED' : 'NODE_OFFLINE'}
            </span>
            <span className="text-[9px] font-mono text-[var(--t3)]">
              {systemHealth === 'healthy' ? 'LATENCY: 12ms' : 'RECONNECTING...'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
