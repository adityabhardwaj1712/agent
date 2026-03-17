"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Fleet Overview", href: "/" },
    { name: "Agent Registry", href: "/agents" },
    { name: "Workflow Builder", href: "/tasks" },
    { name: "ACP", href: "/protocol" },
    { name: "Analytics", href: "/analytics" },
    { name: "Audit Logs", href: "/audit-logs" },
    { name: "Settings", href: "/settings" },
  ];

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
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
