import React from "react";
import "./globals.css";
import { SidebarNav } from "./components/SidebarNav";
import { CommandPalette } from "./components/CommandPalette";

export const metadata = {
  title: "AgentCloud Dashboard",
  description: "AI Agent Fleet Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CommandPalette />
        <div className="ac-shell">
          <aside className="ac-sidebar">
            <div className="ac-sidebar-logo">
              <div className="ac-logo-mark">AC</div>
              <div className="ac-sidebar-logo-text">AgentCloud</div>
            </div>
            <SidebarNav />
          </aside>

          <main className="ac-main">
            <header className="ac-header">
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>AgentCloud Dashboard</h1>
              </div>
              <div className="ac-header-actions">
                <button className="ac-header-btn" title="Search">🔍</button>
                <button className="ac-header-btn" title="Notifications">🔔</button>
                <button className="ac-header-btn" title="Settings">⚙️</button>
              </div>
            </header>

            {children}

            <div className="ac-footer">
              Version 2.0 — Final Master Edition | 2026 &nbsp;|&nbsp; Confidential & Proprietary
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
