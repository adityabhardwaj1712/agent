"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Fleet Overview", href: "/", icon: "⚡" },
  { name: "Agent Registry", href: "/agents", icon: "🤖" },
  { name: "Workflow Builder", href: "/monitor", icon: "🔧" },
  { name: "Marketplace", href: "/leaderboard", icon: "🏪" },
  { name: "Analytics", href: "/analytics", icon: "📊" },
  { name: "Settings", href: "/traces", icon: "⚙️" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="ac-nav-vertical">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ac-nav-item ${isActive ? "ac-nav-item-active" : ""}`}
          >
            <span className="ac-nav-icon">{item.icon}</span>
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
