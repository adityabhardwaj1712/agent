"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, MapPin, Mail, Phone, ShieldCheck, Terminal } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg0)] text-[var(--text)] selection:bg-[var(--cyan)]/30 font-display">
      
      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 ms-glass-panel border-b border-[var(--border)] px-8 py-4 flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="ms-logo-mark">A</div>
          <span className="font-bold tracking-tight uppercase text-sm">AgentCloud <span className="text-[var(--blue)]">Comms</span></span>
        </Link>
        <div className="flex items-center gap-6 text-[10px] font-bold tracking-[0.2em] uppercase">
          <Link href="/landing" className="hover:text-[var(--cyan)] transition">Protocol</Link>
          <Link href="/about" className="hover:text-[var(--cyan)] transition">Manifesto</Link>
          <Link href="/login" className="ms-btn ms-btn-p text-[9px] py-2 px-4 italic">[ AUTHORIZE_ACCESS ]</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-40 pb-20 px-8 text-center border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-[var(--violet)] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg2)] border border-[var(--border)] text-[var(--violet)] text-[9px] font-bold uppercase tracking-[0.3em] mb-4 rounded">
          <Terminal size={10} /> Secure_Signal_Uplink_Activated
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">
          Establish <span className="bg-gradient-to-r from-[var(--violet)] to-[var(--blue)] text-transparent bg-clip-text">Secure Comms</span>
        </h1>
        <p className="max-w-xl mx-auto text-[var(--t3)] text-sm font-body">Connect with the operational core of AgentCloud for sales, support, or partnership inquiries via encrypted signal transmission.</p>
      </header>

      {/* CONTACT GRID */}
      <section className="py-24 px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
        
        {/* LEFT: INFO */}
        <div className="space-y-12">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-[var(--violet)] rounded-full shadow-[0_0_8px_var(--violet)]"></span>
              Strategic HQ
            </h2>
            <div className="space-y-8">
              <ContactInfoItem icon={<MapPin size={18}/>} label="Physical Presence" value="SECTOR 7, SILICON VALLEY HQ // CA 94025" />
              <ContactInfoItem icon={<Mail size={18}/>} label="Signal Stream" value="UPLINK@AGENTCLOUD.IO" />
              <ContactInfoItem icon={<Phone size={18}/>} label="Voice Link" value="+1 (888) AUTO-OPS-0" />
            </div>
          </div>

          <div className="ms-glass-panel p-8 border border-[var(--border)] rounded-xl bg-gradient-to-br from-[var(--bg1)] to-transparent">
             <ShieldCheck size={32} className="text-[var(--cyan)] mb-6 opacity-60" />
             <h3 className="font-bold uppercase text-xs mb-3 tracking-widest">Signal Integrity Policy</h3>
             <p className="text-[var(--t3)] text-[11px] leading-relaxed font-body">All inbound signals are scanned for neural-network safety protocols. Expect a response window of 2-4 operational hours.</p>
          </div>
        </div>

        {/* RIGHT: FORM */}
        <div className="ms-glass-panel border border-[var(--border)] p-10 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--violet)] to-transparent"></div>
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in py-20">
              <div className="w-16 h-16 bg-[var(--bg2)] border border-[var(--violet)] text-[var(--violet)] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(112,0,255,0.2)]">
                <Send size={24} />
              </div>
              <h2 className="text-2xl font-black uppercase mb-4 tracking-tight">Signal Sent</h2>
              <p className="text-[var(--t3)] text-sm font-body">Uplink established. Our mission specialists will review your parameters shortly.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-8 text-[var(--violet)] text-[10px] font-bold uppercase underline underline-offset-8 tracking-widest"
              >
                Send Another Signal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <FormInput label="Callsign (Full Name)" placeholder="OPERATOR_EX" />
                <FormInput label="Encryption ID (Email)" placeholder="UPLINK@MAIL.DOM" type="email" />
              </div>
              <FormInput label="Sector (Subject)" placeholder="GENERAL_INQUIRY" />
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[var(--t3)] mb-2">Message Payload</label>
                <textarea 
                  required
                  rows={6}
                  className="w-full bg-[var(--bg0)] border border-[var(--border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--violet)] transition-colors resize-none font-body"
                  placeholder="ENTER_OBJECTIVES_HERE..."
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full ms-btn py-4 flex items-center justify-center gap-3 text-xs tracking-[0.3em] font-black uppercase"
                style={{ background: 'var(--violet)', color: '#fff' }}
              >
                [ DISPATCH_SIGNAL ] <Send size={14} />
              </button>
            </form>
          )}
        </div>

      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[var(--bg0)] border-t border-[var(--border)] text-center">
        <div className="flex justify-center gap-8 mb-8 text-[10px] font-bold tracking-widest text-[var(--t3)] uppercase">
          <Link href="/about" className="hover:text-[var(--cyan)] transition">About</Link>
          <Link href="/contact" className="hover:text-[var(--cyan)] transition">Contact</Link>
          <Link href="/landing" className="hover:text-[var(--cyan)] transition">Portal</Link>
        </div>
        <p className="text-[var(--t3)] text-[9px] font-mono uppercase opacity-50">© 2026 AgentCloud Comms Array // Sector_01_Mainframe</p>
      </footer>

    </div>
  );
}

function ContactInfoItem({ icon, label, value }: any) {
  return (
    <div className="flex gap-5">
      <div className="w-10 h-10 border border-[var(--border)] flex items-center justify-center text-[var(--t3)] rounded-lg">
        {icon}
      </div>
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--t3)] mb-1">{label}</div>
        <div className="text-sm font-bold tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function FormInput({ label, placeholder, type = "text" }: any) {
  return (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-widest text-[var(--t3)] mb-2">{label}</label>
      <input 
        required
        type={type}
        placeholder={placeholder}
        className="w-full bg-[var(--bg0)] border border-[var(--border)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--violet)] transition-colors font-body"
      />
    </div>
  );
}
