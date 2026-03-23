'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Send, X, Bot, Zap, MessageSquare, Terminal, ChevronRight, Loader2, Sparkles, Cpu, Layers } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function FleetQueryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string, data?: any }[]>([
    { role: 'bot', text: "NEURAL_INTERFACE_READY. Query the fleet for optimization protocols." }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userMsg = prompt.trim();
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const result = await apiFetch('/query/fleet', {
        method: 'POST',
        json: { prompt: userMsg }
      });
      setMessages(prev => [...prev, { role: 'bot', text: result.answer, data: result.data }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "CONNECTION_FAILURE. Protocol sync error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-10 right-10 w-16 h-16 rounded-2xl bg-indigo-500 text-white shadow-[0_12px_40px_rgba(99,102,241,0.4)] flex items-center justify-center z-[500] hover:scale-110 active:scale-95 transition-all group"
      >
        <div className="absolute inset-0 bg-indigo-500 rounded-2xl animate-pulse blur-xl opacity-20 group-hover:opacity-40" />
        {isOpen ? <X size={28} className="relative z-10" /> : <Sparkles size={28} className="relative z-10 animate-pulse" />}
      </button>

      {/* Query Panel */}
      {isOpen && (
        <div className="fixed bottom-32 right-10 w-[450px] h-[650px] glass-card border border-white/10 rounded-[2.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.6)] z-[500] flex flex-col overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="p-8 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Neural_Fleet_Assistant</h3>
                <div className="flex items-center gap-2 text-[9px] font-black text-green-500 uppercase tracking-widest mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   AI_CORE_ACTIVE
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-tertiary hover:text-primary transition-colors">
               <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`max-w-[90%] p-5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-xl ${
                  m.role === 'user' 
                  ? 'bg-indigo-500 text-white rounded-tr-none' 
                  : 'bg-white/5 border border-white/10 text-secondary rounded-tl-none'
                }`}>
                  {m.text}
                  {m.data && (
                    <div className="mt-5 p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-indigo-400 overflow-hidden">
                       <div className="flex items-center gap-2 mb-3 text-tertiary font-black uppercase text-[9px] tracking-widest opacity-40">
                         <Terminal size={12} />
                         STRUCTURED_BLOCK
                       </div>
                       <pre className="overflow-x-auto custom-scrollbar whitespace-pre-wrap">
                         {JSON.stringify(m.data, null, 2)}
                       </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white/5 p-5 rounded-2xl rounded-tl-none flex gap-2 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-6 bg-black/20 border-t border-white/5">
            <div className="relative flex items-center gap-4">
              <input 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="EXECUTE_COMMAND..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-[13px] font-black uppercase tracking-tight text-primary outline-none focus:border-indigo-500/50 transition-all placeholder:text-tertiary/20"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !prompt.trim()}
                className="absolute right-3 p-2.5 text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white rounded-xl transition-all disabled:opacity-20"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
               <div className="flex items-center gap-1.5 text-[9px] font-black text-tertiary uppercase tracking-[0.2em] opacity-30">
                 <Cpu size={10} />
                 Axon_Compute
               </div>
               <div className="w-1 h-1 rounded-full bg-white/10" />
               <div className="flex items-center gap-1.5 text-[9px] font-black text-tertiary uppercase tracking-[0.2em] opacity-30">
                 <Layers size={10} />
                 Deep_Sync
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
