"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, X, Globe, Activity, Shield, Layout, Settings, Terminal, Zap, ChevronRight, History } from "lucide-react";

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
    { name: "View Traces", href: "/traces", description: "Explore event sourcing timeline", icon: <History size={16} /> },
    { name: "Leaderboard", href: "/leaderboard", description: "Top performing agents", icon: <Zap size={16} /> },
    { name: "Execution Monitor", href: "/monitor", description: "Real-time task processing", icon: <Activity size={16} /> },
    { name: "Agent Registry", href: "/agents", description: "Manage autonomous agents", icon: <Terminal size={16} /> },
    { name: "Audit Logs", href: "/audit-logs", description: "Security and compliance trail", icon: <Shield size={16} /> },
  ];

  const filteredLines = commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-black/40 animate-fade-in" onClick={() => setIsOpen(false)}>
      <div 
        className="glass-card w-full max-w-2xl rounded-[1.5rem] border border-white/10 overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.6)] animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 flex items-center gap-5">
          <Search size={22} className="text-indigo-500/50" />
          <input 
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-xl font-black text-primary placeholder:text-tertiary/30 uppercase tracking-tight"
            placeholder="ACCESS_SYSTEM_PROTOCOL..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
             <kbd className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">ESC</kbd>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {filteredLines.map(cmd => (
            <button
              key={cmd.href}
              className="w-full text-left p-4 rounded-2xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 flex items-center justify-between transition-all group"
              onClick={() => {
                router.push(cmd.href);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-tertiary/5 flex items-center justify-center text-tertiary group-hover:text-indigo-500 group-hover:bg-indigo-500/5 transition-all">
                   {cmd.icon}
                </div>
                <div>
                  <div className="font-black text-[13px] text-primary uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{cmd.name}</div>
                  <div className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">{cmd.description}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
          
          {filteredLines.length === 0 && (
            <div className="py-20 text-center space-y-4">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-tertiary/20">
                  <X size={32} />
               </div>
               <p className="text-[11px] font-black text-tertiary uppercase tracking-[0.3em] italic opacity-40">No_Matrix_Protocol_Found</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center px-8">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">
                 <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">↑↓</kbd>
                 Navigate
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">
                 <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">↵</kbd>
                 Select
              </div>
           </div>
           <span className="text-[9px] font-black text-indigo-500/50 uppercase tracking-[0.2em]">Neural_Search_v4.2</span>
        </div>
      </div>
    </div>
  );
}
