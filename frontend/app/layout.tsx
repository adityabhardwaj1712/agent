import "./globals.css";
import { ThemeToggle } from "./components/ThemeToggle";

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
            <nav className="ac-nav-vertical">
              <a href="/" className="ac-nav-item ac-nav-item-active">
                Fleet Overview
              </a>
              <a href="/agents" className="ac-nav-item">
                Agent Registry
              </a>
              <a href="/tasks" className="ac-nav-item">
                Workflow Builder
              </a>
              <a href="/protocol" className="ac-nav-item">
                ACP
              </a>
              <a href="/analytics" className="ac-nav-item">
                Analytics
              </a>
              <a href="/settings" className="ac-nav-item">
                Settings
              </a>
            </nav>
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

