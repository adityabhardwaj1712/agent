import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  LayoutDashboard, 
  Bot, 
  Zap, 
  Layers, 
  ShoppingBag, 
  BarChart3, 
  Brain, 
  History, 
  CheckCircle2, 
  FileText, 
  Settings,
  Rocket,
  ShieldCheck,
  Database,
  Wallet,
  Radio
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, theme, onToggleTheme }) => {
  const [counts, setCounts] = useState({
    agents: 0,
    approvals: 0,
    traces: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const data = await apiFetch<any>('/analytics/summary');
        setCounts({
          agents: data.active_agents || 0,
          approvals: data.pending_approvals || 0,
          traces: data.active_events || 0
        });
      } catch (err) {
        console.error('Sidebar fetch failed:', err);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'fleet', label: 'Fleet Overview', icon: <LayoutDashboard size={18} />, section: 'Core' },
    { id: 'agents', label: 'Neural Agents', icon: <Bot size={18} />, section: 'Core', badge: counts.agents, badgeColor: 'y' },
    { id: 'autonomous', label: 'Auto Missions', icon: <Rocket size={18} />, section: 'Core' },
    { id: 'workflow', label: 'Logic Flows', icon: <Zap size={18} />, section: 'Core' },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag size={18} />, section: 'Core' },
    
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} />, section: 'Insights' },
    { id: 'memory', label: 'Neural Memory', icon: <Brain size={18} />, section: 'Insights' },
    { id: 'knowledge', label: 'Knowledge Hub', icon: <Database size={18} />, section: 'Insights' },
    { id: 'traces', label: 'Execution Traces', icon: <History size={18} />, section: 'Insights' },
    
    { id: 'approvals', label: 'Guardrails', icon: <ShieldCheck size={18} />, section: 'Safety', badge: counts.approvals },
    { id: 'audit', label: 'System Audit', icon: <FileText size={18} />, section: 'Safety' },
    { id: 'billing', label: 'Billing', icon: <Wallet size={18} />, section: 'Safety' },
    { id: 'protocol', label: 'Protocol Mesh', icon: <Radio size={18} />, section: 'Safety' },
    { id: 'settings', label: 'Node Settings', icon: <Settings size={18} />, section: 'Safety' },
  ];

  const sections = ['Core', 'Insights', 'Safety'];

  return (
    <aside className="ms-sb-wide">
      <div className="ms-logo-wide">
        <div className="ms-logo-mark">AC</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ms-logo-name">AGENTCLOUD <span className="text-[var(--blue)]">OPS</span></div>
          <div className="ms-logo-ver">V3.1 ENTERPRISE</div>
        </div>
      </div>

      <nav className="ms-nav-wide">
        {sections.map(section => (
          <React.Fragment key={section}>
            <div className="ms-nav-sec">{section}</div>
            {navItems.filter(item => item.section === section).map(item => (
              <div 
                key={item.id}
                className={`ms-nav-itm ${activeView === item.id ? 'act' : ''}`}
                onClick={() => onViewChange(item.id)}
              >
                <span className="opacity-70">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ms-nav-badge ${item.badgeColor || ''}`}>{item.badge}</span>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="ms-sb-footer">
        <div className="ms-avatar">AK</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
            Aryan Khanna
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--mono)', letterSpacing: '1px' }}>SYSTEM_ROOT</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
