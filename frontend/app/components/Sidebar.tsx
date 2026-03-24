'use client';

import React from 'react';
import { 
  Zap, 
  Bot, 
  ClipboardList, 
  GitBranch, 
  Brain, 
  Link2, 
  Search, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  CreditCard,
  Plus,
  Sun,
  Moon,
  LogOut,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onRegisterAgent: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  onRegisterAgent,
  theme,
  onToggleTheme
}) => {
  const categories = [
    {
      title: 'Core',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Zap },
        { id: 'agents', label: 'Agents', icon: Bot },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList, badge: 3 },
        { id: 'workflow', label: 'Workflows', icon: GitBranch },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: 'memory', label: 'Memory', icon: Brain },
        { id: 'protocol', label: 'Protocol', icon: Link2 },
        { id: 'traces', label: 'Traces', icon: Search },
        { id: 'approvals', label: 'Approvals', icon: CheckCircle, badge: 2 },
      ]
    },
    {
      title: 'Platform',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'audit', label: 'Audit Logs', icon: FileText },
        { id: 'billing', label: 'Billing', icon: CreditCard },
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark" style={{ background: 'linear-gradient(135deg, var(--a), var(--a2))' }}>
          <Settings size={16} color="white" />
        </div>
        <div className="flex flex-col">
          <span className="logo-name">AgentCloud</span>
          <span className="logo-ver">v1.0 · Orchestration</span>
        </div>
      </div>
      
      <nav className="nav">
        {categories.map((cat, idx) => (
          <React.Fragment key={idx}>
            <div className="nav-grp">{cat.title}</div>
            {cat.items.map(item => (
              <div 
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'act' : ''}`}
                onClick={() => onViewChange(item.id)}
              >
                <item.icon className="ico" size={14} />
                {item.label}
                {item.badge && (
                  <span className={`nav-badge ${item.id === 'approvals' ? 'amber' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-btn" onClick={onRegisterAgent}>
          + Register Agent
        </button>
        <button className="theme-btn" onClick={onToggleTheme}>
          <span id="theme-ico">{theme === 'dark' ? '☀' : '🌙'}</span>
          <span id="theme-lbl">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
