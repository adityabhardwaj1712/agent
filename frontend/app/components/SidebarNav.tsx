"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Overview", href: "/", icon: "○" },
  { name: "Agents", href: "/agents", icon: "□" },
  { name: "Leaderboard", href: "/leaderboard", icon: "⬡" },
  { name: "Execution Monitor", href: "/monitor", icon: "△" },
  { name: "Trace Explorer", href: "/traces", icon: "⬢" },
  { name: "Memory", href: "/memory", icon: "⊡" },
  { name: "Analytics", href: "/analytics", icon: "📈" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="ac-nav-vertical">
      <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-4 ml-4">Command</div>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ac-nav-item ${isActive ? "ac-nav-item-active" : ""}`}
          >
            <span className="text-lg opacity-80">{item.icon}</span>
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
