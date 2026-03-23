"use client";
import React, { useState, useEffect } from "react";
import { X, Command, Shift, Keyboard, ChevronRight, Zap, Target, MousePointer2 } from "lucide-react";

const SHORTCUTS = [
  { key: "?", desc: "Toggle_HUD_Interface", category: "Core_Sys" },
  { key: "Ctrl+K", desc: "Axon_Command_Palette", category: "Core_Sys" },
  { key: "G+H", desc: "Nav_Home_Base", category: "Navigation" },
  { key: "G+A", desc: "Nav_Agent_Matrix", category: "Navigation" },
  { key: "G+T", desc: "Nav_Task_Stream", category: "Navigation" },
  { key: "G+L", desc: "Nav_Analytics_Core", category: "Navigation" },
  { key: "C", desc: "Initiate_Neural_Link", category: "Actions" },
  { key: "N", desc: "Register_New_Entity", category: "Actions" },
  { key: "R", desc: "Reboot_Interface", category: "Actions" },
];

export default function ShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsOpen(false)}>
      <div className="glass-card rounded-[3rem] border border-white/10 p-10 w-full max-w-2xl shadow-[0_64px_128px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-in relative" onClick={(e) => e.stopPropagation()}>
        {/* Background glow Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex justify-between items-start mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Keyboard size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-primary tracking-tight uppercase">Neural_Shortcuts</h2>
              <p className="text-[11px] font-black text-tertiary uppercase tracking-[0.3em] opacity-40 mt-1">Interface_Acceleration_Protocols</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-tertiary hover:bg-white/5 hover:text-primary transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 relative z-10">
          {["Core_Sys", "Navigation", "Actions"].map(cat => (
            <div key={cat} className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">{cat}</span>
              </div>
              <div className="space-y-4">
                {SHORTCUTS.filter(s => s.category === cat).map(s => (
                  <div key={s.key} className="flex justify-between items-center group">
                    <span className="text-[13px] font-black text-secondary group-hover:text-primary transition-colors tracking-tight uppercase">{s.desc}</span>
                    <div className="flex gap-2">
                      {s.key.split("+").map(k => (
                        <kbd key={k} className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[10px] font-black text-primary min-w-[28px] text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                          {k === "Ctrl" ? "⌘" : k === "Shift" ? "⇧" : k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center gap-4 text-[11px] font-black text-tertiary uppercase tracking-widest opacity-60">
           <Zap size={14} className="text-indigo-500" />
           <span>Press <span className="text-primary italic mx-1">ESC</span> to terminate interface</span>
           <span className="mx-2 opacity-20">|</span>
           <span>Press <span className="text-primary italic mx-1">?</span> to toggle visibility</span>
        </div>
      </div>
    </div>
  );
}
