"use client";
import React, { useState, useEffect } from "react";
import { X, Command, Shift, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { key: "?", desc: "Show / Hide this shortcut menu", category: "General" },
  { key: "Ctrl+K", desc: "Open Command Palette", category: "General" },
  { key: "G then H", desc: "Go to Dashboard", category: "Navigation" },
  { key: "G then A", desc: "Go to Agents", category: "Navigation" },
  { key: "G then T", desc: "Go to Tasks", category: "Navigation" },
  { key: "G then L", desc: "Go to Analytics", category: "Navigation" },
  { key: "C", desc: "Start new Chat", category: "Actions" },
  { key: "N", desc: "Register new Agent", category: "Actions" },
  { key: "R", desc: "Refresh current view", category: "Actions" },
];

export default function ShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with '?' (Shift + /)
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        setIsOpen((prev) => !prev);
      }
      // Close with 'Esc'
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", 
      backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", 
      alignItems: "center", justifyContent: "center"
    }} onClick={() => setIsOpen(false)}>
      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-active)",
        borderRadius: 24, padding: 32, width: "min(600px, 90vw)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.6)", animation: "slideUp 0.3s ease-out"
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: 12, 
              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)"
            }}>
              <Keyboard size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Keyboard Shortcuts</h2>
              <p style={{ color: "var(--text-tertiary)", fontSize: 13, marginTop: 2 }}>Speed up your workflow</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ 
            background: "none", border: "none", cursor: "pointer", 
            color: "var(--text-tertiary)", padding: 8, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s"
          }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
             onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {["General", "Navigation", "Actions"].map(cat => (
            <div key={cat} style={{ gridColumn: cat === "General" ? "1 / span 1" : "" }}>
              <div style={{ 
                fontSize: 10, fontWeight: 800, textTransform: "uppercase", 
                letterSpacing: "0.1em", color: "var(--text-tertiary)", marginBottom: 12,
                borderBottom: "1px solid var(--border-muted)", paddingBottom: 6
              }}>{cat}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SHORTCUTS.filter(s => s.category === cat).map(s => (
                  <div key={s.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.desc}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {s.key.split("+").map(k => (
                        <kbd key={k} style={{
                          padding: "2px 6px", borderRadius: 4, background: "var(--bg-tertiary)",
                          border: "1px solid var(--border-muted)", borderBottomWidth: 3,
                          fontSize: 11, fontWeight: 700, color: "var(--text-primary)",
                          minWidth: 20, textAlign: "center", fontFamily: "inherit"
                        }}>{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: 32, padding: "12px 16px", borderRadius: 12, 
          background: "var(--bg-tertiary)", border: "1px solid var(--border-muted)",
          fontSize: 11, color: "var(--text-tertiary)", textAlign: "center"
        }}>
          Press <kbd style={{ fontWeight: 800, color: "var(--text-secondary)" }}>Esc</kbd> to close or <kbd style={{ fontWeight: 800, color: "var(--text-secondary)" }}>?</kbd> to toggle.
        </div>
      </div>
    </div>
  );
}
