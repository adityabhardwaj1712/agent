"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (window.localStorage.getItem("agentcloud-theme") as Theme | null) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    setTheme(saved);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("agentcloud-theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
  }

  return (
    <button type="button" className="ac-theme-toggle" onClick={toggle}>
      <span>{theme === "dark" ? "🌙" : "☀️"}</span> {theme === "dark" ? "Dark" : "Light"} mode
    </button>
  );
}

