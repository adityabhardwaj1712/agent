"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, FileText, Gavel, Eye } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[var(--bg0)] text-[var(--text)] selection:bg-[var(--blue)]/30 font-display">
      
      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 ms-glass-panel border-b border-[var(--border)] px-8 py-4 flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="ms-logo-mark">A</div>
          <span className="font-bold tracking-tight uppercase text-sm">AgentCloud <span className="text-[var(--blue)]">Legal</span></span>
        </Link>
        <div className="flex items-center gap-6 text-[10px] font-bold tracking-[0.2em] uppercase">
          <Link href="/landing" className="hover:text-[var(--cyan)] transition">Operations</Link>
          <Link href="/about" className="hover:text-[var(--cyan)] transition">Intel</Link>
          <Link href="/login" className="ms-btn ms-btn-p text-[9px] py-2 px-4 italic">[ AUTHORIZE ]</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-40 pb-20 px-8 text-center border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[var(--amber)] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg2)] border border-[var(--border)] text-[var(--amber)] text-[9px] font-bold uppercase tracking-[0.3em] mb-4 rounded">
          Operational_Boundaries_v1.2
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">
          Tactical <span className="bg-gradient-to-r from-[var(--amber)] to-[var(--orange)] text-transparent bg-clip-text">Legal Protocols</span>
        </h1>
        <p className="max-w-xl mx-auto text-[var(--t3)] text-sm font-body">The governed parameters and privacy directives for autonomous agent orchestration within the AgentCloud domain.</p>
      </header>

      {/* CONTENT */}
      <section className="py-24 px-8 max-w-4xl mx-auto space-y-20">
        
        {/* PRIVACY */}
        <div>
          <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3 tracking-tight">
            <Eye className="text-[var(--cyan)]" size={20} />
            Signal Privacy Directive
          </h2>
          <div className="space-y-6 text-[var(--t2)] font-body text-sm leading-relaxed">
            <p>1. <span className="font-bold text-[var(--text)] uppercase tracking-tight">Data Ingestion:</span> We capture operational telemetry solely to optimize agent routing and auto-healing logic. No neural memory shards are stored permanently without explicit user-assigned vector storage.</p>
            <p>2. <span className="font-bold text-[var(--text)] uppercase tracking-tight">Encryption:</span> All signals between your command center and the agent fleet are encrypted using AES-256-GCM protocols at the transport layer.</p>
            <p>3. <span className="font-bold text-[var(--text)] uppercase tracking-tight">Third-Party Uplinks:</span> When using external LLM providers (OpenAI, Anthropic, etc.), data is transmitted via secure API handshakes. We do not sell signal data to outside tactical units.</p>
          </div>
        </div>

        {/* TERMS */}
        <div>
          <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-3 tracking-tight">
            <Gavel className="text-[var(--violet)]" size={20} />
            Terms of Command
          </h2>
          <div className="space-y-6 text-[var(--t2)] font-body text-sm leading-relaxed">
            <p>1. <span className="font-bold text-[var(--text)] uppercase tracking-tight">Operational Responsibility:</span> You are the lead commander. You are responsible for the actions initiated by any autonomous units deployed via your secure token.</p>
            <p>2. <span className="font-bold text-[var(--text)] uppercase tracking-tight">Resource Usage:</span> Users agree to manage resource burn responsibly. Excessive signal spam that degrades the global mesh network may result in temporary system throttling.</p>
            <p>3. <span className="font-bold text-[var(--text)] uppercase tracking-tight">Agent Integrity:</span> You may not use AgentCloud agents to initiate adversarial attacks or engage in unauthorized system infiltration elsewhere.</p>
          </div>
        </div>

        {/* COMPLIANCE */}
        <div className="ms-glass-panel p-10 border border-[var(--border)] rounded-2xl bg-gradient-to-br from-[var(--bg1)] to-transparent flex flex-col md:flex-row gap-8 items-center">
            <ShieldAlert size={48} className="text-[var(--amber)] opacity-60" />
            <div>
                <h3 className="font-bold uppercase text-xs mb-3 tracking-widest text-[var(--amber)]">Protocol Violation Notice</h3>
                <p className="text-[var(--t3)] text-[11px] leading-relaxed font-body">Failure to adhere to these tactical directives will result in immediate termination of your operational license and revocation of all secure uplink tokens.</p>
            </div>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[var(--bg0)] border-t border-[var(--border)] text-center">
        <div className="flex justify-center gap-8 mb-8 text-[10px] font-bold tracking-widest text-[var(--t3)] uppercase">
          <Link href="/about" className="hover:text-[var(--cyan)] transition">About</Link>
          <Link href="/contact" className="hover:text-[var(--cyan)] transition">Contact</Link>
          <Link href="/landing" className="hover:text-[var(--cyan)] transition">Portal</Link>
        </div>
        <p className="text-[var(--t3)] text-[9px] font-mono uppercase opacity-50">© 2026 AgentCloud Legal Array // Sector_01_Mainframe</p>
      </footer>

    </div>
  );
}
