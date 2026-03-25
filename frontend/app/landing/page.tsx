"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Activity, BrainCircuit, ShieldAlert } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg0)] text-[var(--text)] overflow-hidden selection:bg-[var(--blue)]/30">
      
      {/* BACKGROUND GRADIENTS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[var(--blue)] opacity-10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[var(--violet)] opacity-10 blur-[120px] rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-[var(--cyan)] opacity-5 blur-[100px] rounded-full"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <div className="ms-logo-mark">A</div>
          <span className="font-display text-xl tracking-tight hidden sm:block">AgentCloud <span className="text-[var(--blue)] font-bold">Ops</span></span>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--t2)]">
            <a href="#features" className="hover:text-[var(--text)] transition">Features</a>
            <a href="#demo" className="hover:text-[var(--text)] transition">Demo</a>
            <a href="#pricing" className="hover:text-[var(--text)] transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/login" className="ms-btn ms-btn-g text-xs sm:text-sm">
                Sign In
             </Link>
             <Link href="/signup" className="ms-btn ms-btn-p text-xs sm:text-sm">
                Launch Dashboard <ArrowRight size={14} />
             </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-24 pb-32 text-center px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full ms-glass-panel border-l-2 border-l-[var(--blue)] text-[var(--blue)] text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in mx-auto">
            <span className="ms-dot ms-dot-b ms-dot-pulse"></span>
            Self-Operating Intelligence V2.0
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] mb-6 tracking-tight animate-slide-up">
            Autonomous Operations <br/>
            <span className="bg-gradient-to-r from-[var(--cyan)] via-[var(--blue)] to-[var(--violet)] text-transparent bg-clip-text">that run themselves.</span>
          </h1>
          <p className="text-[var(--t2)] mt-8 max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed animate-fade-in delay-300 font-body">
            Monitor, optimize, and auto-heal your high-performance agent workflows in real-time. AgentCloud Ops converts raw infrastructure into an autonomous, self-healing orchestration engine.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in delay-500">
            <Link href="/signup" className="ms-btn ms-btn-p px-8 py-4 text-base shadow-[0_0_30px_var(--glow-blue)] hover:shadow-[0_0_40px_var(--glow-blue)] transition-all duration-300">
              Start Building Free
            </Link>
            <button className="ms-btn ms-btn-g px-8 py-4 text-base group">
              <span className="group-hover:text-[var(--text)] transition-colors">Watch Live Demo</span>
            </button>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-[var(--border)] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg2)] to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Orchestration <span className="text-[var(--blue)]">Redefined</span></h2>
            <p className="text-[var(--t2)] max-w-xl mx-auto text-lg">Everything you need to run, scale, and deeply optimize your autonomous AI agent fleet.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            <FeatureCard 
              title="Auto-Healing Engine" 
              desc="The system automatically detects deep failures, silently retries tasks with exponentially backoff, and switches to peer agents to maintain 99.9% uptime." 
              icon={<Activity size={24} className="text-[var(--green)]" />}
            />
            <FeatureCard 
              title="Autonomous Decisions" 
              desc="An internal supervisor model optimizes cluster costs and performance in real-time based on historical routing data." 
              icon={<BrainCircuit size={24} className="text-[var(--violet)]" />}
            />
            <FeatureCard 
              title="Incident Resolution" 
              desc="When a critical workflow path completely fails, the platform automatically reroutes traffic and attempts a soft-restart logic sequence." 
              icon={<ShieldAlert size={24} className="text-[var(--amber)]" />}
            />
          </div>
        </section>

        {/* STATS / IMPACT */}
        <section className="py-24 mt-12 bg-[var(--bg1)] border-y border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-[var(--border)]">
            <div className="px-4">
              <div className="text-4xl sm:text-5xl font-display font-bold text-[var(--blue)] mb-2 drop-shadow-[0_0_15px_var(--glow-blue)]">+42%</div>
              <div className="text-[var(--t3)] text-xs uppercase font-bold tracking-[0.2em]">Efficiency GAIN</div>
            </div>
            <div className="px-4">
              <div className="text-4xl sm:text-5xl font-display font-bold text-[var(--violet)] mb-2">-15%</div>
              <div className="text-[var(--t3)] text-xs uppercase font-bold tracking-[0.2em]">Compute cost</div>
            </div>
            <div className="px-4">
              <div className="text-4xl sm:text-5xl font-display font-bold text-[var(--green)] mb-2">99.9%</div>
              <div className="text-[var(--t3)] text-xs uppercase font-bold tracking-[0.2em]">Success rate</div>
            </div>
            <div className="px-4">
              <div className="text-4xl sm:text-5xl font-display font-bold text-[var(--amber)] mb-2">&lt;2ms</div>
              <div className="text-[var(--t3)] text-xs uppercase font-bold tracking-[0.2em]">Decision latency</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-[var(--bg0)] text-center text-[var(--t3)] text-sm font-mono">
        <p>© 2026 AgentCloud Ops Framework. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="ms-glass-panel p-8 rounded-2xl border border-[var(--border)] hover:border-[var(--blue)]/50 hover:bg-[var(--bg2)] transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--blue)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="w-14 h-14 bg-[var(--bg3)] border border-[var(--border)] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--bg4)] transition-all duration-300 shadow-lg">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold mb-3 text-[var(--text)] group-hover:text-white">{title}</h3>
      <p className="text-[var(--t2)] leading-relaxed text-sm font-body">{desc}</p>
    </div>
  );
}
