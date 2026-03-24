import React from "react";
import "./globals.css";

export const metadata = {
  title: "AgentCloud | Orchestration Platform",
  description: "Next-gen Autonomous Agent Orchestration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.setAttribute('data-theme', theme);
            })()
          `
        }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
