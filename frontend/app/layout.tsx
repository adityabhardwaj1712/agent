import React from "react";
import "./globals.css";
import { SidebarNav } from "./components/SidebarNav";
import { CommandPalette } from "./components/CommandPalette";
import ThemeToggle from "./components/ThemeToggle";
import CostTicker from "./components/CostTicker";
import { Search, Bell, Plus, Settings } from "lucide-react";

export const metadata = {
  title: "AgentCloud | Autonomous Ops",
  description: "Next-gen Autonomous Agent Communication Protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="ac-shell">
        <CommandPalette />
        <aside className="ac-sidebar">
          <div className="ac-sidebar-logo">
            <div className="ac-logo-mark">A</div>
            <span className="ac-sidebar-logo-text">AgentCloud</span>
          </div>
          
          <SidebarNav />

          <div style={{ marginTop: 'auto', padding: '16px 0 0 0' }}>
             <button className="ac-nav-item" style={{ 
               background: 'var(--accent-primary)', 
               color: 'white', 
               width: '100%', 
               justifyContent: 'center',
               boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
             }}>
               <Plus size={16} />
               <span>Add New Agent</span>
             </button>
          </div>
        </aside>

        <main className="ac-main">
          <header className="ac-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
               <CostTicker />
            </div>
            
            <div className="ac-header-actions">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                 <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                 <input 
                    type="text" 
                    placeholder="Search agents, tasks, logs..." 
                    className="ac-header-input"
                    style={{ 
                      padding: '8px 12px 8px 36px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: '10px',
                      fontSize: '13px',
                      width: '280px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                 />
                 <span style={{ position: 'absolute', right: '12px', fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, opacity: 0.6 }}>Ctrl+K</span>
              </div>
              
              <button className="ac-header-btn"><Bell size={18} /></button>
              <ThemeToggle />
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'var(--bg-tertiary)', 
                overflow: 'hidden',
                border: '1px solid var(--border-muted)'
              }}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
              </div>
            </div>
          </header>

          <div className="ac-content-container">
            {children}
          </div>

          <footer className="ac-footer">
             AgentCloud Autonomous Protocols © 2026 | System Status: Optimal
          </footer>
        </main>
      </body>
    </html>
  );
}
