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
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--t2)]">
            <a href="#features" className="hover:text-[var(--text)] transition">Features</a>
            <Link href="/about" className="hover:text-[var(--text)] transition">About</Link>
            <a href="#pricing" className="hover:text-[var(--text)] transition">Pricing</a>
            <a href="#faq" className="hover:text-[var(--text)] transition">FAQ</a>
            <Link href="/contact" className="hover:text-[var(--text)] transition">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/login" className="ms-btn ms-btn-g text-xs sm:text-sm">
                Sign In
             </Link>
             <Link href="/signup" className="ms-btn ms-btn-p text-xs sm:text-sm">
                Join System <ArrowRight size={14} />
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

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-[var(--border)] relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Tactical <span className="text-[var(--violet)]">Tiers</span></h2>
            <p className="text-[var(--t2)] max-w-xl mx-auto text-lg">Scale your autonomous operations from singular units to global fleets.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard 
                tier="Recon" 
                price="Free" 
                features={["Up to 3 Active Agents", "Basic Telemetry", "Community Support", "100 Task/Month Limit"]} 
                btnText="Initialize Free"
            />
            <PricingCard 
                tier="Batten" 
                price="$49/mo" 
                features={["Up to 20 Active Agents", "Advanced Analytics", "Priority Support", "Unlimited Tasks", "Custom Tools"]} 
                highlighted
                btnText="Start Battle-Ready"
            />
            <PricingCard 
                tier="Titan" 
                price="Custom" 
                features={["Unlimited Fleet Size", "White-glove Infrastructure", "24/7 Dedicated Ops", "On-prem Deployment"]} 
                btnText="Contact Command"
            />
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-24 px-6 max-w-4xl mx-auto border-t border-[var(--border)]">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold mb-4 uppercase tracking-widest italic">Operational Intelligence <span className="text-[var(--cyan)]">FAQ</span></h2>
          </div>
          <div className="space-y-6">
            <FAQItem question="How does the auto-healing work?" answer="The system monitors health pulses from every agent node. If a heartbeat is missed, the supervisor automatically spins up a replacement instance and transfers the state context." />
            <FAQItem question="Can I deploy on private infrastructure?" answer="Yes, the Titan tier supports full air-gapped and private cloud deployments with dedicated security protocols." />
            <FAQItem question="What LLMs are supported?" answer="We support all major providers (OpenAI, Anthropic, Google) as well as local execution for Llama 3 and Gemma via our integrated engine." />
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

      <footer className="py-24 bg-[var(--bg0)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 text-left">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="ms-logo-mark">A</div>
              <span className="font-display font-bold">AgentCloud</span>
            </div>
            <p className="text-[var(--t3)] text-xs leading-relaxed font-body">The standard for high-performance, autonomous agent orchestration and mission-critical UI.</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--t2)] mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-[var(--t3)]">
              <li><Link href="/login" className="hover:text-[var(--cyan)] transition">Login</Link></li>
              <li><Link href="/signup" className="hover:text-[var(--cyan)] transition">Signup</Link></li>
              <li><a href="#features" className="hover:text-[var(--cyan)] transition">Telemetry</a></li>
              <li><a href="#" className="hover:text-[var(--cyan)] transition">Live Demo</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--t2)] mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-[var(--t3)]">
              <li><Link href="/about" className="hover:text-[var(--cyan)] transition">Our Mission</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--cyan)] transition">Secure Uplink</Link></li>
              <li><a href="#" className="hover:text-[var(--cyan)] transition">Fleet Tech</a></li>
              <li><a href="#" className="hover:text-[var(--cyan)] transition">Partners</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--t2)] mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-[var(--t3)]">
              <li><a href="#" className="hover:text-[var(--cyan)] transition">Operational Privacy</a></li>
              <li><a href="#" className="hover:text-[var(--cyan)] transition">Terms of Command</a></li>
              <li><a href="#" className="hover:text-[var(--cyan)] transition">Security Audit</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center pt-8 border-t border-[var(--border)] mx-8">
            <p className="text-[var(--t3)] text-[10px] font-mono uppercase tracking-widest opacity-50">© 2026 AgentCloud Ops Framework. ALL_SYSTEMS_NOMINAL.</p>
        </div>
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

function PricingCard({ tier, price, features, highlighted, btnText }: any) {
    return (
        <div className={`ms-glass-panel p-10 rounded-2xl border ${highlighted ? 'border-[var(--violet)] scale-105 shadow-[0_0_40px_rgba(112,0,255,0.15)]' : 'border-[var(--border)]'} transition-all relative overflow-hidden group`}>
            {highlighted && <div className="absolute top-4 right-4 bg-[var(--violet)] text-white text-[8px] font-bold px-2 py-1 rounded uppercase tracking-[0.2em] animate-pulse">Operational Priority</div>}
            <h3 className="text-2xl font-display font-black mb-1 uppercase tracking-tight">{tier}</h3>
            <div className="text-4xl font-black mb-8 text-[var(--text)]">{price}</div>
            <ul className="space-y-4 mb-10">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-[var(--t3)] text-xs font-body">
                        <span className="w-1.5 h-1.5 bg-[var(--cyan)] rounded-full opacity-60"></span>
                        {f}
                    </li>
                ))}
            </ul>
            <Link href="/signup" className={`w-full ms-btn py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center ${highlighted ? 'ms-btn-p' : 'ms-btn-g'}`}>
                {btnText}
            </Link>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    return (
        <div className="ms-glass-panel p-6 border border-[var(--border)] hover:border-[var(--cyan)]/40 transition-colors">
            <h4 className="font-bold text-[var(--text)] text-sm mb-2 uppercase tracking-wide italic leading-snug">❯ {question}</h4>
            <p className="text-[var(--t3)] text-xs font-body leading-relaxed pl-4 border-l border-[var(--border)] ml-2">{answer}</p>
        </div>
    );
}
