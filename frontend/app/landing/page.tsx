"use client";

import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090F] text-white overflow-hidden selection:bg-blue-500/30">
      {/* BACKGROUND GRADIENTS */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full animate-pulse-slow delay-700"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">A</div>
          <span className="font-bold text-xl tracking-tight">AgentCloud <span className="text-blue-500">Ops</span></span>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#demo" className="hover:text-white transition">Demo</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>
          <Link href="/login" className="px-5 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition text-sm">
            Launch Dashboard
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-20 pb-32 text-center px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
            Self-Operating Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight animate-slide-up">
            Autonomous AI Operations <br/>
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 text-transparent bg-clip-text">that runs itself</span>
          </h1>
          <p className="text-gray-400 mt-6 max-w-2xl mx-auto text-lg leading-relaxed animate-fade-in delay-300">
            Monitor, optimize, and auto-heal your high-performance agent workflows in real-time. AgentCloud Ops converts raw infrastructure into an autonomous orchestration engine.
          </p>
          <div className="mt-10 flex flex-col md:flex-row justify-center gap-4 animate-fade-in delay-500">
            <Link href="/signup" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xl shadow-blue-600/20 transition transform hover:-translate-y-1">
              Start Building Free
            </Link>
            <button className="px-8 py-4 bg-[#161D2E] text-white font-bold rounded-xl border border-[#2A3356] hover:bg-[#1c2540] transition">
              Watch Demo Video
            </button>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Orchestration Redefined</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Everything you need to run, scale, and optimize your autonomous agent fleet.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              title="Auto Mode" 
              desc="The system automatically detects failures, retries tasks, and switches agents to maintain 99.9% uptime." 
              icon="⚡"
            />
            <FeatureCard 
              title="AI Decisions" 
              desc="Internal GPT-powered engine optimizes your costs and performance in real-time based on historical data." 
              icon="🧠"
            />
            <FeatureCard 
              title="Self-Healing" 
              desc="When a node fails, the platform automatically reroutes traffic and attempts a soft-restart of the agent." 
              icon="🔁"
            />
          </div>
        </section>

        {/* STATS / IMPACT */}
        <section className="py-24 bg-gradient-to-b from-transparent to-[#0d1017]">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2">+42%</div>
              <div className="text-gray-500 text-sm uppercase font-bold tracking-widest">Efficiency GAIN</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-500 mb-2">-15%</div>
              <div className="text-gray-500 text-sm uppercase font-bold tracking-widest">Compute cost</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-500 mb-2">99.9%</div>
              <div className="text-gray-500 text-sm uppercase font-bold tracking-widest">Success rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-500 mb-2">&lt;2ms</div>
              <div className="text-gray-500 text-sm uppercase font-bold tracking-widest">Decision latency</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-[#1a1f3a] text-center text-gray-500 text-sm">
        <p>© 2026 AgentCloud Ops. All rights reserved.</p>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.15; }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-700 { animation-delay: 0.7s; }
      `}</style>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: string }) {
  return (
    <div className="bg-[#161D2E] p-8 rounded-2xl border border-[#2A3356] hover:border-blue-500 transition-all duration-300 group">
      <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
