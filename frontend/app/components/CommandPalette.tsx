"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const commands = [
    { name: "View Traces", href: "/traces", description: "Explore event sourcing timeline" },
    { name: "Leaderboard", href: "/leaderboard", description: "Top performing agents" },
    { name: "Execution Monitor", href: "/monitor", description: "Real-time task processing" },
    { name: "Agent Registry", href: "/agents", description: "Manage autonomous agents" },
    { name: "System Settings", href: "/settings", description: "Configure platform parameters" },
  ];

  const filteredLines = commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="cmd-palette-wrapper" onClick={() => setIsOpen(false)}>
      <div 
        className="glass-panel w-full max-w-2xl mx-4 rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-muted flex items-center gap-4">
          <span className="text-xl opacity-40">🔍</span>
          <input 
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-tertiary"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="px-2 py-1 bg-tertiary rounded text-[10px] font-bold opacity-40">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredLines.map(cmd => (
            <button
              key={cmd.href}
              className="w-full text-left p-3 rounded-xl hover:bg-white/5 flex items-center justify-between transition-colors group"
              onClick={() => {
                router.push(cmd.href);
                setIsOpen(false);
              }}
            >
              <div>
                <div className="font-medium text-sm group-hover:text-accent-primary transition-colors">{cmd.name}</div>
                <div className="text-xs text-secondary">{cmd.description}</div>
              </div>
              <span className="text-xs opacity-0 group-hover:opacity-40 translate-x-1 group-hover:translate-x-0 transition-all">↵</span>
            </button>
          ))}
          {filteredLines.length === 0 && (
            <div className="p-8 text-center text-secondary text-sm italic">No commands found matching "{query}"</div>
          )}
        </div>
        <div className="p-3 bg-tertiary border-t border-muted flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40">
           <span>↑↓ to navigate</span>
           <span>↵ to select</span>
        </div>
      </div>
    </div>
  );
}
