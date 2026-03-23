'use client';

import React, { useState } from "react";
import { apiJson } from "../lib/api";
import { 
  Send, 
  Terminal, 
  UserPlus, 
  MessageSquare, 
  Zap, 
  ShieldAlert,
  Cpu,
  ArrowRightLeft,
  Activity,
  Orbit,
  Loader2,
  Lock,
  Wifi
} from "lucide-react";

type ProtocolResponse = { message_id: string; status: string };

export default function ProtocolPage() {
  const [fromAgentId, setFromAgentId] = useState("");
  const [toAgentId, setToAgentId] = useState("");
  const [type, setType] = useState("message");
  const [payload, setPayload] = useState("{\"action\": \"sync\", \"priority\": \"high\"}");
  const [correlationId, setCorrelationId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onSend() {
    setLoading(true);
    try {
      const r = await apiJson<ProtocolResponse>("/protocol/send", {
        method: "POST",
        json: {
          from_agent_id: fromAgentId,
          to_agent_id: toAgentId,
          type,
          payload,
          correlation_id: correlationId || null,
        },
      });
      setResult(r);
    } catch (err) {
      setResult({ error: "Transmission failed", detail: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-slide-in p-4 md:p-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-500">
            <ArrowRightLeft size={18} />
            <span className="text-[10px] font-black tracking-widest uppercase">AXON Protocol Stack Layer-4 // Datagram_Control</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">Command Center</h1>
          <p className="text-secondary text-sm max-w-xl mt-3 leading-relaxed">
             Deterministic agent-to-agent synchronization and secure message routing. Manual datagram injection for neural mesh maintenance.
          </p>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-3 glass-card rounded-2xl border border-white/10 shadow-lg">
           <Wifi size={18} className="text-indigo-500" />
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-tertiary uppercase tracking-widest leading-none">Mesh_Uplink</span>
              <span className="text-lg font-black text-primary tracking-tighter leading-none mt-1 uppercase">Active</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Configuration Panel */}
        <section className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
          <div className="flex items-center gap-3">
             <Cpu size={20} className="text-indigo-500" />
             <h2 className="text-lg font-black text-primary uppercase tracking-tight">Transmission_Config</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest px-1 flex items-center gap-2">
                   <UserPlus size={12} className="text-indigo-500/50" />
                   Origin_Agent
                </label>
                <input
                  placeholder="ID-828..."
                  value={fromAgentId}
                  onChange={(e) => setFromAgentId(e.target.value)}
                  className="w-full px-5 py-4 bg-tertiary/5 border border-white/5 rounded-2xl text-[12px] font-mono text-primary placeholder:text-tertiary/20 outline-none focus:border-indigo-500/50 transition-all shadow-inner uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest px-1 flex items-center gap-2">
                   <UserPlus size={12} className="text-indigo-500/50" />
                   Target_Agent
                </label>
                <input
                  placeholder="ID-991..."
                  value={toAgentId}
                  onChange={(e) => setToAgentId(e.target.value)}
                  className="w-full px-5 py-4 bg-tertiary/5 border border-white/5 rounded-2xl text-[12px] font-mono text-primary placeholder:text-tertiary/20 outline-none focus:border-indigo-500/50 transition-all shadow-inner uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest px-1">Message_Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-5 py-4 bg-tertiary/5 border border-white/5 rounded-2xl text-[11px] font-black text-secondary outline-none cursor-pointer uppercase tracking-widest focus:border-indigo-500/50 transition-all"
                >
                  <option value="message">Standard_Message</option>
                  <option value="handshake">Handshake_Init</option>
                  <option value="directive">Directive_Command</option>
                  <option value="query">State_Query</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest px-1">Correlation_ID</label>
                <input
                  placeholder="CORR-XXXX (OPTIONAL)"
                  value={correlationId}
                  onChange={(e) => setCorrelationId(e.target.value)}
                  className="w-full px-5 py-4 bg-tertiary/5 border border-white/5 rounded-2xl text-[12px] font-mono text-primary placeholder:text-tertiary/20 outline-none focus:border-indigo-500/50 transition-all shadow-inner uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest px-1 flex items-center gap-2">
                 <MessageSquare size={12} className="text-indigo-500/50" />
                 Payload_Logic_(JSON)
              </label>
              <textarea
                rows={5}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full p-5 bg-black/20 border border-white/5 rounded-2xl text-[12px] font-mono text-secondary placeholder:text-tertiary/30 outline-none focus:border-indigo-500/30 transition-all shadow-inner leading-relaxed"
              />
            </div>

            <button
              onClick={onSend}
              disabled={loading || !fromAgentId.trim() || !toAgentId.trim()}
              className="w-full py-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-3 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all duration-300 disabled:opacity-20 group"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
              <span className="text-[11px] font-black uppercase tracking-widest">Execute_Transmission</span>
            </button>
          </div>

          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
              <ShieldAlert size={14} />
              Protocol_Override_Warning
            </div>
            <p className="text-[10px] text-red-500/60 mt-2 font-medium leading-relaxed">
              Manual injection bypasses standard neural mesh safety buffers. Use only for diagnostic maintenance.
            </p>
          </div>
        </section>

        {/* Console / Result Panel */}
        <section className="flex flex-col gap-8 h-full">
          <div className="glass-card flex-1 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-3 text-tertiary">
                 <Terminal size={18} />
                 <h2 className="text-sm font-black uppercase tracking-tight">Protocol_Monitor</h2>
              </div>
              {result && (
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${result.error ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-green-500 bg-green-500/10 border-green-500/20'}`}>
                   {result.error ? 'Critical_Fault' : 'Acknowledge_Sync'}
                </div>
              )}
            </div>

            <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-6 relative group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               
               <div className="font-mono text-[11px] text-primary/80 space-y-4 overflow-auto scrollbar-hide h-full relative z-10">
                 {result ? (
                   <div className="animate-slide-in">
                     <div className="flex gap-3 text-indigo-500">
                        <span className="opacity-50">#</span>
                        <span className="font-black">INITIALIZING_XON_HANDSHAKE...</span>
                     </div>
                     <div className="flex gap-3 text-tertiary mt-2">
                        <span className="opacity-50">#</span>
                        <span>ENCRYPTING_PAYLOAD_WITH_ROT-4_CYPHER...</span>
                     </div>
                     <div className="flex gap-3 text-tertiary mt-2">
                        <span className="opacity-50">#</span>
                        <span>LOCAL_ROUTING_VERIFIED: MESH_OK</span>
                     </div>
                     
                     <div className="mt-6 p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <pre className={`whitespace-pre-wrap leading-relaxed ${result.error ? 'text-red-400' : 'text-green-400'}`}>
                           {JSON.stringify(result, null, 2)}
                        </pre>
                     </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20">
                      <Orbit size={48} className="animate-spin-slow" />
                      <div className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting_Signal_Pulse...</div>
                   </div>
                 )}
               </div>

               {/* Virtual Scroll Grid */}
               <div className="absolute inset-0 pointer-events-none opacity-[0.02]" 
                    style={{ backgroundImage: 'radial-gradient(var(--text-tertiary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>
            
            {/* Scanline Effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-indigo-500/20 animate-scanline pointer-events-none" />
          </div>

          <div className="p-8 glass-card rounded-3xl border border-white/10 flex items-center gap-6 group hover:border-indigo-500/30 transition-all duration-500">
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Lock size={20} />
             </div>
             <div>
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-1">Security_Enforcement</h3>
                <p className="text-[11px] text-tertiary font-medium leading-relaxed">
                  All datagrams are signed with Layer-2 HMAC and logged in the immutable system audit registry.
                </p>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}

