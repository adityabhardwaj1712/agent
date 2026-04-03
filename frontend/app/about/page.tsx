"use client";

import React from "react";
import Link from "next/link";
import { Shield, Target, Zap, Globe, Lock, Cpu } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg0)] text-[var(--text)] selection:bg-[var(--cyan)]/30 font-display">
      
      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 ms-glass-panel border-b border-[var(--border)] px-8 py-4 flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="ms-logo-mark">A</div>
          <span className="font-bold tracking-tight uppercase text-sm">AgentCloud <span className="text-[var(--blue)]">Intel</span></span>
        </Link>
        <div className="flex items-center gap-6 text-[10px] font-bold tracking-[0.2em] uppercase">
          <Link href="/landing" className="hover:text-[var(--cyan)] transition">Operations</Link>
          <Link href="/contact" className="hover:text-[var(--cyan)] transition">Uplink</Link>
          <Link href="/login" className="ms-btn ms-btn-p text-[9px] py-2 px-4 italic">[ AUTHORIZE ]</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-32 pb-20 px-8 max-w-6xl mx-auto text-center border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[var(--blue)] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="inline-block px-3 py-1 bg-[var(--bg2)] border border-[var(--border)] text-[var(--cyan)] text-[9px] font-bold uppercase tracking-[0.3em] mb-6 rounded">
          Mission_Manifesto_v4.0
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8 tracking-tighter uppercase">
          Orchestrating the <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--cyan)] to-[var(--blue)]">Autonomous Frontier</span>
        </h1>
        <p className="max-w-2xl mx-auto text-[var(--t2)] text-lg leading-relaxed font-body">
          AgentCloud was forged in the void between raw compute and cognitive automation. We provide the hardened infrastructure required to scale high-intensity agent fleets across fragmented neural networks.
        </p>
      </header>

      {/* MISSION GRID */}
      <section className="py-24 px-8 max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6 uppercase tracking-tight italic flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[var(--cyan)]"></span>
            Operational Doctrine
          </h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[var(--bg1)] border border-[var(--border)] flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                <Target className="text-[var(--cyan)]" size={20} />
              </div>
              <div>
                <h3 className="font-bold mb-2 uppercase text-sm tracking-wide">Precision Governance</h3>
                <p className="text-[var(--t3)] text-sm leading-relaxed">Absolute control over every neural trace and memory shard. Our governance layer ensures agents operate within surgical parameters without deviation.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[var(--bg1)] border border-[var(--border)] flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(112,0,255,0.1)]">
                <Shield className="text-[var(--violet)]" size={20} />
              </div>
              <div>
                <h3 className="font-bold mb-2 uppercase text-sm tracking-wide">Hardened Security</h3>
                <p className="text-[var(--t3)] text-sm leading-relaxed">End-to-end encryption for every autonomous signal. We treat agent data with military-grade isolation protocols to prevent cognitive leakage.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="ms-glass-panel aspect-square relative flex items-center justify-center border border-[var(--border)] overflow-hidden group">
          <div className="absolute inset-0 bg-[var(--blue)] opacity-[0.02] group-hover:opacity-[0.05] transition-opacity"></div>
          <Cpu size={180} className="text-[var(--blue)] opacity-20 absolute rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
          <div className="relative z-10 text-center p-12">
            <div className="text-6xl font-black text-[var(--cyan)] mb-2">99.9%</div>
            <div className="text-[10px] font-bold tracking-[0.5em] text-[var(--t3)] uppercase">Uptime_Link_Stability</div>
          </div>
        </div>
      </section>

      {/* CORE TECH */}
      <section className="py-24 bg-[var(--bg1)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Under the Armor</h2>
            <p className="text-[var(--t3)] max-w-xl mx-auto font-body">The architectural pillars that support the most resilient agent fleet in the industry.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <TechCard icon={<Zap/>} label="Auto-Healing" desc="Neural node recovery in <200ms." />
            <TechCard icon={<Globe/>} label="Multi-Cloud" desc="Serverless deployment across any sector." />
            <TechCard icon={<Lock/>} label="Zero-Trust" desc="Agent-to-agent authenticated handshakes." />
            <TechCard icon={<Cpu/>} label="Optimized" desc="Dynamic resource burn management." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--cyan)]/5 to-transparent"></div>
        <h2 className="text-4xl md:text-6xl font-black uppercase mb-12 tracking-tight">Ready to Command?</h2>
        <Link href="/signup" className="ms-btn ms-btn-p px-12 py-5 text-lg font-bold">
           [ INITIATE_DEPLOYMENT ]
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[var(--bg0)] border-t border-[var(--border)] text-center">
        <div className="flex justify-center gap-8 mb-8 text-[10px] font-bold tracking-widest text-[var(--t3)] uppercase">
          <Link href="/about" className="hover:text-[var(--cyan)] transition">About</Link>
          <Link href="/contact" className="hover:text-[var(--cyan)] transition">Contact</Link>
          <Link href="/landing" className="hover:text-[var(--cyan)] transition">Protocol</Link>
        </div>
        <p className="text-[var(--t3)] text-[9px] font-mono uppercase opacity-50">© 2026 AgentCloud Ops Framework // Sector_01_Mainframe</p>
      </footer>

    </div>
  );
}

function TechCard({ icon, label, desc }: any) {
  return (
    <div className="p-8 border border-[var(--border)] bg-[var(--bg0)] hover:border-[var(--cyan)]/40 transition-colors group">
      <div className="text-[var(--cyan)] mb-6 opacity-60 group-hover:opacity-100 transition-opacity">{icon}</div>
      <div className="font-bold uppercase text-xs mb-2 tracking-widest">{label}</div>
      <div className="text-[var(--t3)] text-[11px] leading-relaxed font-body">{desc}</div>
    </div>
  );
}
