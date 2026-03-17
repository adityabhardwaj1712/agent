"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Brain, 
  Activity, 
  CheckCircle2, 
  FileText,
  MessageCircle
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Memory", href: "/memory", icon: Brain },
  { name: "Traces", href: "/traces", icon: Activity },
  { name: "Approvals", href: "/approvals", icon: CheckCircle2 },
  { name: "Audit Logs", href: "/audit-logs", icon: FileText },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="ac-nav-vertical">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ac-nav-item ${isActive ? "ac-nav-item-active" : ""}`}
          >
            <span className="ac-nav-icon">
              <Icon size={18} />
            </span>
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
