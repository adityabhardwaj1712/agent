import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

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
          agents: data.active_agents,
          approvals: data.pending_approvals,
          traces: data.active_events
        });
      } catch (err) {
        console.error('Sidebar fetch failed:', err);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000); // 15s refetch
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="ms-sb-wide">
      <div className="ms-logo-wide">
        <div className="ms-logo-mark">AC</div>
        <div>
          <div className="ms-logo-name">AGENTCLOUD</div>
          <div className="ms-logo-ver">v2.4 · pro</div>
        </div>
      </div>

      <nav className="ms-nav-wide">
        <div className="ms-nav-sec">Platform</div>
        <div 
          className={`ms-nav-itm ${activeView === 'unified' ? 'act' : ''}`}
          onClick={() => onViewChange('unified')}
        >
          <span>🏠</span> Unified Command
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'dashboard' ? 'act' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <span>📊</span> Overview
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'agents' ? 'act' : ''}`}
          onClick={() => onViewChange('agents')}
        >
          <span>🤖</span> Agents
          {counts.agents > 0 && <span className="ms-nav-badge">{counts.agents}</span>}
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'tasks' ? 'act' : ''}`}
          onClick={() => onViewChange('tasks')}
        >
          <span>📋</span> Tasks
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'workflow' ? 'act' : ''}`}
          onClick={() => onViewChange('workflow')}
        >
          <span>🔀</span> Workflows
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'marketplace' ? 'act' : ''}`}
          onClick={() => onViewChange('marketplace')}
        >
          <span>🛍</span> Marketplace
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'analytics' ? 'act' : ''}`}
          onClick={() => onViewChange('analytics')}
        >
          <span>📈</span> Analytics
        </div>

        <div className="ms-nav-sec">System</div>
        <div 
          className={`ms-nav-itm ${activeView === 'memory' ? 'act' : ''}`}
          onClick={() => onViewChange('memory')}
        >
          <span>🧠</span> Memory
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'settings' ? 'act' : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <span>⚙️</span> Settings
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'traces' ? 'act' : ''}`}
          onClick={() => onViewChange('traces')}
        >
          <span>🔬</span> Traces
          {counts.traces > 0 && <span className="ms-nav-badge y">{counts.traces}</span>}
        </div>
        <div 
          className={`ms-nav-itm ${activeView === 'approvals' ? 'act' : ''}`}
          onClick={() => onViewChange('approvals')}
        >
          <span>✅</span> Approvals
          {counts.approvals > 0 && <span className="ms-nav-badge r">{counts.approvals}</span>}
        </div>
      </nav>

      <div className="ms-sb-footer">
        <div className="ms-avatar">DU</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            demo@agentcloud.ai
          </div>
          <div style={{ fontSize: 9, color: 'var(--s-t3)', fontFamily: 'var(--mono)' }}>admin</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
