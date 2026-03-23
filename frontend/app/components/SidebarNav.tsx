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
        <div key={group.label} className="mb-6">
          <div className="text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase px-4 mb-3 opacity-60">
            {group.label}
          </div>
          {group.items.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 mb-1 group relative ${
                  isActive 
                    ? "gradient-bg text-white shadow-lg glow scale-[1.02]" 
                    : "text-secondary hover:bg-tertiary hover:text-primary"
                }`}
              >
                <Icon size={18} className={`${isActive ? "text-white" : "opacity-70 group-hover:opacity-100 transition-opacity"}`} />
                <span className={`text-sm tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>{item.name}</span>
                
                {(item as any).badge && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white font-bold backdrop-blur-md border border-white/10">
                    {(item as any).badge}
                  </span>
                )}
                
                {isActive && (
                  <div className="absolute right-2 w-1 h-1 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
