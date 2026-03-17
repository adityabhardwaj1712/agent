import React from "react";
import "./globals.css";
import { ThemeToggle } from "./components/ThemeToggle";
import { SidebarNav } from "./components/SidebarNav";
import { CommandPalette } from "./components/CommandPalette";

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
          <aside className="ac-sidebar glass-panel">
            <div className="ac-sidebar-logo">
              <div className="ac-logo-mark" />
              <div className="ac-sidebar-logo-text">AgentCloud</div>
            </div>
            <SidebarNav />
            <div className="mt-auto pt-8 border-t border-muted opacity-40 text-[10px] uppercase tracking-widest font-bold">
              Autonomous Systems Unit
            </div>
          </aside>
          
          <main className="ac-main">
            <header className="flex items-center justify-between mb-12">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-primary">Strategic Overview</h1>
                <p className="text-sm text-secondary mt-1">Real-time intelligence from your autonomous agents.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-tertiary border border-muted rounded-md text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-accent-success mr-2">●</span> System Nominal
                </div>
                <ThemeToggle />
              </div>
            </header>
            
            {children}
            
            <footer className="mt-24 pt-8 border-t border-muted flex justify-between text-xs text-tertiary">
              <div>&copy; 2026 AgentCloud. Calm Intelligence Foundation.</div>
              <div>API: {process.env.NEXT_PUBLIC_API_BASE_URL || "8000"}</div>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}

