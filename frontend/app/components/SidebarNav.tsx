"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BarChart3, Brain, Activity,
  CheckCircle2, FileText, MessageCircle, ListTodo,
  Workflow, Trophy, Code2, Webhook, ChevronRight
} from "lucide-react";

const navGroups = [
  {
    label: "Core",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard },
      { name: "Chat", href: "/chat", icon: MessageCircle, badge: "Live" },
      { name: "Agents", href: "/agents", icon: Users },
      { name: "Tasks", href: "/tasks", icon: ListTodo },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Traces", href: "/traces", icon: Activity },
      { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { name: "Memory", href: "/memory", icon: Brain },
    ],
  },
  {
    label: "Control",
    items: [
      { name: "Approvals", href: "/approvals", icon: CheckCircle2 },
      { name: "Audit Logs", href: "/audit-logs", icon: FileText },
      { name: "Protocol", href: "/protocol", icon: Workflow },
      { name: "Developer", href: "/developer", icon: Code2 },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="ac-nav-vertical" style={{ gap: 0 }}>
      {navGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--text-tertiary)", textTransform: "uppercase",
            padding: "0 12px", marginBottom: 6
          }}>{group.label}</div>
          {group.items.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ac-nav-item ${isActive ? "ac-nav-item-active" : ""}`}
                style={{ position: "relative", marginBottom: 1 }}
              >
                <span className="ac-nav-icon" style={{ opacity: isActive ? 1 : 0.6 }}>
                  <Icon size={16} />
                </span>
                <span style={{ flex: 1 }}>{item.name}</span>
                {(item as any).badge && (
                  <span style={{
                    fontSize: 9, padding: "2px 6px", borderRadius: 4,
                    background: "rgba(16,185,129,0.15)", color: "#10B981",
                    border: "1px solid rgba(16,185,129,0.25)", fontWeight: 700,
                    letterSpacing: "0.04em"
                  }}>{(item as any).badge}</span>
                )}
                {isActive && (
                  <ChevronRight size={12} style={{ color: "var(--accent-primary)", opacity: 0.6 }} />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
