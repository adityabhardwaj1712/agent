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
  LogOut
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
        { id: 'approvals', label: 'Approvals', icon: CheckCircle, badge: 2, badgeColor: 'amber' },
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
    <aside className="ac-sidebar">
      <div className="ac-sidebar-logo">
        <div className="ac-logo-mark">A</div>
        <div className="flex flex-col">
          <span className="ac-sidebar-logo-text">AgentCloud</span>
          <span className="text-[10px] text-tertiary uppercase tracking-wider font-bold">Elite Orchestrator</span>
        </div>
      </div>
      
      <nav className="ac-nav-vertical flex-1">
        {categories.map((cat, idx) => (
          <React.Fragment key={idx}>
            <div className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-3 mt-6 ml-4 opacity-50">{cat.title}</div>
            {cat.items.map(item => (
              <div 
                key={item.id}
                className={`ac-nav-item ${activeView === item.id ? 'ac-nav-item-active' : ''}`}
                onClick={() => onViewChange(item.id)}
              >
                <item.icon className="ac-nav-icon" size={18} />
                {item.label}
                {item.id === 'approvals' && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                    2
                  </span>
                )}
                {item.id === 'tasks' && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
                    3
                  </span>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-border/50">
        <button className="btn btn-p btn-sm w-full" onClick={onRegisterAgent}>
          <Plus size={14} className="mr-2" /> Register Agent
        </button>
        
        <div className="flex items-center justify-between px-2">
           <button className="ac-header-btn w-9 h-9" onClick={onToggleTheme}>
             {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
           </button>
           
           <button 
             className="ac-header-btn w-9 h-9 text-red-500/70 hover:text-red-500" 
             onClick={() => {
               localStorage.removeItem('token');
               window.location.href = '/landing';
             }}
           >
             <LogOut size={14} />
           </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
