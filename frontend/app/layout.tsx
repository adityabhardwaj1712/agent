import React from "react";
import "./globals.css";
import { SidebarNav } from "./components/SidebarNav";
import { CommandPalette } from "./components/CommandPalette";
import ShortcutsOverlay from './components/ShortcutsOverlay';
import FleetQueryPanel from './components/FleetQueryPanel';
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
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme') || 'dark';
              if (theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
              } else {
                document.documentElement.removeAttribute('data-theme');
              }
            })()
          `
        }} />
      </head>
      <body className="ac-shell transition-colors duration-300">
        <ShortcutsOverlay />
        <FleetQueryPanel />
        <CommandPalette />
        <aside className="ac-sidebar glass-card">
          <div className="ac-sidebar-logo mb-8">
            <h1 className="text-2xl font-bold flex items-center gradient-text">
              <span className="ac-logo-mark mr-3 gradient-bg text-white border-none">A</span>
              AgentCloud
            </h1>
          </div>
          
          <SidebarNav />

          <div className="mt-auto pt-4">
             <button className="nav-item flex items-center px-4 py-3 rounded-xl gradient-bg text-white w-full justify-center shadow-lg hover:opacity-90 transition glow">
               <Plus size={16} className="mr-2" />
               <span className="font-semibold">New Agent</span>
             </button>
          </div>
        </aside>

        <main className="ac-main">
          <header className="ac-header glass-card !sticky !top-0 !z-40">
            <div className="flex items-center gap-6">
               <CostTicker />
            </div>
            
            <div className="ac-header-actions">
              <div className="relative flex items-center w-80">
                 <Search size={16} className="absolute left-4 text-tertiary z-10" />
                 <input 
                    type="text" 
                    placeholder="Search Agents, Tasks, Logs [Ctrl+K]" 
                    className="ac-header-input"
                 />
              </div>
              
              <button className="ac-header-btn glass-card !w-10 !h-10 !flex !items-center !justify-center" aria-label="Notifications"><Bell size={18} /></button>
              <ThemeToggle />
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-color cursor-pointer shadow-sm">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
              </div>
            </div>
          </header>

          <div className="ac-content-container animate-slide-in">
            {children}
          </div>

          <footer className="ac-footer">
             <div className="flex items-center gap-2">
                <span className="ac-status-dot-live"></span>
                <span className="text-xs text-tertiary">AgentCloud OS v1.0 • System Optimal</span>
             </div>
             <div className="text-xs text-tertiary">© 2026 AXON Neural Network</div>
          </footer>
        </main>
      </body>
    </html>
  );
}
