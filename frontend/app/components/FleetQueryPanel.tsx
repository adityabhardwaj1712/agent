'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Send, X, Bot, Zap, MessageSquare, Terminal, ChevronRight } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function FleetQueryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string, data?: any }[]>([
    { role: 'bot', text: "Hello! I'm your Fleet Assistant. Ask me anything about your agents or operations." }
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
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting to the fleet right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="ac-btn-primary fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-[500] hover:scale-110 active:scale-95 transition-all"
        style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)', background: 'var(--accent-primary)' }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Query Panel */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[400px] h-[550px] bg-secondary border border-active rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] z-[500] flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-6 bg-tertiary border-b border-muted flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Fleet Assistant</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-success font-bold uppercase">
                   <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                   AI Engine Active
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-accent-primary text-white rounded-tr-none' 
                  : 'bg-tertiary border border-muted text-secondary rounded-tl-none'
                }`}>
                  {m.text}
                  {m.data && (
                    <div className="mt-4 p-3 bg-secondary rounded-xl border border-muted font-mono text-[11px] text-accent overflow-hidden">
                       <div className="flex items-center gap-2 mb-2 text-tertiary font-bold uppercase text-[9px]">
                         <Terminal size={10} />
                         Structured Data
                       </div>
                       <pre className="overflow-x-auto">
                         {JSON.stringify(m.data, null, 2)}
                       </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-tertiary p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-tertiary border-t border-muted">
            <div className="relative flex items-center gap-3">
              <input 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask e.g. 'How many agents?'"
                className="w-full bg-secondary border border-active rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-accent transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !prompt.trim()}
                className="absolute right-2 p-2 text-accent hover:bg-accent-primary/10 rounded-lg transition-colors disabled:opacity-30"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-3 text-[10px] text-tertiary text-center flex items-center justify-center gap-1">
              <Zap size={10} className="text-warning" />
              Powered by AgentCloud Core Logic
            </p>
          </div>
        </div>
      )}
    </>
  );
}
