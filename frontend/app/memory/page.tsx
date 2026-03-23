'use client';

import React, { useState } from "react";
import { apiJson } from "../lib/api";
import { 
  Database, 
  Search, 
  PenLine, 
  Loader2, 
  Brain, 
  Terminal,
  Save,
  Trash2,
  RefreshCw,
  Cpu,
  Layers
} from "lucide-react";

type MemoryWriteResponse = { status: string; memory_id: string };
type MemoryRow = { memory_id: string; agent_id: string; content: string; created_at?: string };

export default function MemoryPage() {
  const [agentId, setAgentId] = useState("");
  const [content, setContent] = useState("hello world memory");
  const [query, setQuery] = useState("hello");
  const [writeResult, setWriteResult] = useState<unknown>(null);
  const [searchResult, setSearchResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function onWrite() {
    setLoading(true);
    try {
      const r = await apiJson<MemoryWriteResponse>("/memory/write", {
        method: "POST",
        json: { agent_id: agentId, content },
      });
      setWriteResult(r);
    } finally {
      setLoading(false);
    }
  }

  async function onSearch() {
    setLoading(true);
    try {
      const r = await apiJson<MemoryRow[]>(
        `/memory/search?q=${encodeURIComponent(query)}&agent_id=${encodeURIComponent(agentId)}`
      );
      setSearchResult(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-slide-in p-4 md:p-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-500">
            <Layers size={18} />
            <span className="text-[10px] font-black tracking-widest uppercase">Substrate Layer-0 // Memory_Interface</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">Neural Memory</h1>
          <p className="text-secondary text-sm max-w-xl mt-3 leading-relaxed">
             Direct access to the agentic long-term memory substrate. PERSIST and QUERY mission-critical state objects.
          </p>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-3 glass-card rounded-2xl border border-white/10 shadow-lg">
           <Database size={18} className="text-indigo-500" />
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-tertiary uppercase tracking-widest leading-none">Database_Status</span>
              <span className="text-lg font-black text-primary tracking-tighter leading-none mt-1 uppercase">Synchronized</span>
           </div>
        </div>
      </header>

      <section className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-10">
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <Cpu size={14} className="text-indigo-500" />
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest">Select_Target_Agent_Node</label>
           </div>
           <input
             value={agentId}
             onChange={(e) => setAgentId(e.target.value)}
             placeholder="ENTER_NODE_IDENTITY_HASH..."
             className="w-full px-6 py-4 bg-tertiary/5 border border-white/5 rounded-2xl text-[12px] font-mono text-primary placeholder:text-tertiary/30 outline-none focus:border-indigo-500/50 transition-all shadow-inner uppercase tracking-wider"
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Write Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <PenLine size={18} className="text-green-500" />
                 <h2 className="text-sm font-black text-primary uppercase tracking-widest">Commit_Memory</h2>
              </div>
            </div>
            
            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full p-6 bg-black/20 border border-white/5 rounded-3xl text-[12px] font-mono text-secondary placeholder:text-tertiary/30 outline-none focus:border-green-500/30 transition-all shadow-inner leading-relaxed"
                placeholder="INPUT_MEMORY_SUBSTRATE_DATA..."
              />
              <div className="absolute top-4 right-4 text-tertiary opacity-20 pointer-events-none font-mono text-[10px]">RAW_STORAGE</div>
            </div>

            <button
              onClick={onWrite}
              disabled={loading || !agentId.trim()}
              className="w-full py-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center gap-3 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 disabled:opacity-20 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
              <span className="text-[11px] font-black uppercase tracking-widest">Commit_to_Substrate</span>
            </button>

            {writeResult && (
              <div className="animate-slide-in">
                 <div className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-2 px-1">Commit_Registry_Response</div>
                 <pre className="p-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] font-mono text-green-400 overflow-auto scrollbar-hide shadow-inner leading-relaxed">
                   {JSON.stringify(writeResult, null, 2)}
                 </pre>
              </div>
            )}
          </div>

          {/* Search Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Search size={18} className="text-indigo-500" />
                 <h2 className="text-sm font-black text-primary uppercase tracking-widest">Retrieve_Memory</h2>
              </div>
            </div>

            <div className="relative group">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-6 py-4 bg-black/20 border border-white/5 rounded-2xl text-[12px] font-mono text-secondary placeholder:text-tertiary/30 outline-none focus:border-indigo-500/30 transition-all shadow-inner uppercase"
                placeholder="QUERY_BY_VECTOR_OR_KEYWORD..."
              />
              <div className="absolute top-1/2 -translate-y-1/2 right-4 text-tertiary opacity-20 pointer-events-none font-mono text-[10px]">SCAN</div>
            </div>

            <button
              onClick={onSearch}
              disabled={loading || !agentId.trim()}
              className="w-full py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-3 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all duration-300 disabled:opacity-20 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />}
              <span className="text-[11px] font-black uppercase tracking-widest">Execute_Search_Scan</span>
            </button>

            {searchResult && (
              <div className="animate-slide-in">
                 <div className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-2 px-1">Retrieve_Scan_Results</div>
                 <pre className="p-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] font-mono text-indigo-400 overflow-auto scrollbar-hide shadow-inner leading-relaxed">
                   {JSON.stringify(searchResult, null, 2)}
                 </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Visual background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5 z-[-1]">
         <Brain size={600} className="absolute -top-[20%] -right-[10%] text-indigo-500/20 blur-[80px]" />
         <div className="absolute bottom-[10%] left-[5%] w-[40rem] h-[40rem] bg-green-500 rounded-full filter blur-[100px]" />
      </div>
    </div>
  );
}

