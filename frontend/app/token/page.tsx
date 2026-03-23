'use client';

import React, { useEffect, useState } from "react";
import { 
  Lock, 
  Key, 
  Trash2, 
  Save, 
  ShieldCheck, 
  Fingerprint,
  Zap,
  Globe,
  Cpu,
  Layers
} from "lucide-react";

export default function TokenPage() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(window.localStorage.getItem("agentcloud_token") || "");
  }, []);

  function save() {
    window.localStorage.setItem("agentcloud_token", token.trim());
    // Using a more subtle notification would be better than an alert, 
    // but keeping it simple for now as per functionality
  }

  function clear() {
    window.localStorage.removeItem("agentcloud_token");
    setToken("");
  }

  return (
    <div className="max-w-[1000px] mx-auto animate-slide-in p-4 md:p-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-500">
            <Lock size={18} />
            <span className="text-[10px] font-black tracking-widest uppercase">Security Layer-1 // Authentication_Substrate</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">Access Credentials</h1>
          <p className="text-secondary text-sm max-w-xl mt-3 leading-relaxed">
             Securely inject JWT identifiers into the AXON-MESH. These credentials authorize all high-clearance neural directives.
          </p>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-3 glass-card rounded-2xl border border-white/10 shadow-lg">
           <ShieldCheck size={18} className="text-indigo-500" />
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-tertiary uppercase tracking-widest leading-none">Auth_Protocol</span>
              <span className="text-lg font-black text-primary tracking-tighter leading-none mt-1 uppercase">Symmetric_JWT</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2 glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Fingerprint size={20} className="text-indigo-500" />
               <h2 className="text-lg font-black text-primary uppercase tracking-tight">Identity_Payload</h2>
            </div>
            <div className="text-[10px] font-mono text-tertiary opacity-30 uppercase tracking-widest">Base64_Encoded</div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/5 blur-[20px] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={8}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-8 bg-black/20 border border-white/5 rounded-[2rem] text-[12px] font-mono text-secondary placeholder:text-tertiary/20 outline-none focus:border-indigo-500/30 transition-all shadow-inner leading-relaxed relative z-10 scrollbar-hide"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={save}
              className="flex-1 py-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-3 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all duration-300 group"
            >
              <Save size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest">Commit_Credential</span>
            </button>
            <button
              onClick={clear}
              className="px-8 py-5 bg-tertiary/5 border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-tertiary hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all duration-300 group"
            >
              <Trash2 size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Purge_Registry</span>
            </button>
          </div>
        </section>

        <aside className="space-y-6">
           <div className="p-8 glass-card rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-indigo-500/30 transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                 <Zap size={18} />
              </div>
              <h3 className="text-sm font-black text-primary uppercase tracking-widest">Integration_Active</h3>
              <p className="text-[11px] text-tertiary font-medium leading-relaxed">
                Tokens persist in the local vault. All subsequent neural transmissions will automatically attach this signature in the <code>Authorization</code> header.
              </p>
           </div>

           <div className="p-8 glass-card rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-indigo-500/30 transition-all duration-500 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                 <Globe size={18} />
              </div>
              <h3 className="text-sm font-black text-primary uppercase tracking-widest">Mesh_Sync</h3>
              <p className="text-[11px] text-tertiary font-medium leading-relaxed">
                Credentials are restricted to this local substrate. Neural-Mesh cloud sync is currently disabled for this node.
              </p>
           </div>
        </aside>
      </div>
      
      {/* Visual background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5 z-[-1]">
         <div className="absolute top-[10%] left-[20%] w-[30rem] h-[30rem] bg-indigo-500 rounded-full filter blur-[150px]" />
         <div className="absolute bottom-[20%] right-[10%] w-[20rem] h-[20rem] bg-blue-500 rounded-full filter blur-[120px]" />
      </div>
    </div>
  );
}

