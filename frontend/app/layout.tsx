import React from "react";
import "./globals.css";
import { ThemeToggle } from "./components/ThemeToggle";
import { SidebarNav } from "./components/SidebarNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="ac-shell">
          <aside className="ac-sidebar">
            <div className="ac-sidebar-logo">
              <div className="ac-sidebar-logo-mark">AC</div>
              <div className="ac-sidebar-logo-text">AgentCloud</div>
            </div>
            <SidebarNav />
            <div className="ac-sidebar-footer">v1.0 · Internal preview</div>
          </aside>
          <div className="ac-main">
            <header className="ac-header">
              <div>
                <div className="ac-brand-title">Fleet overview</div>
                <div className="ac-brand-sub">
                  Active agent pulse, ACP activity, and incidents.
                </div>
              </div>
              <div className="ac-header-right">
                <span>Theme</span>
                <ThemeToggle />
              </div>
            </header>
            {children}
            <footer className="ac-footer">
              API base:{" "}
              <code>
                {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}
              </code>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}

