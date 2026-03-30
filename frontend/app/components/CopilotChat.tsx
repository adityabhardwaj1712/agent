'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Sparkles, MessageSquare, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Neural link established. How can I optimize your fleet operations today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/v1/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('agentcloud_token')}`
        },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMsg }] })
      });

      if (!response.ok) throw new Error('Neural link failure');

      // Set up SSE reader
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
               const dataStr = line.replace('data: ', '');
               if (dataStr === '[DONE]') break;
               try {
                  const data = JSON.parse(dataStr);
                  if (data.content) {
                    assistantMsg += data.content;
                    setMessages(prev => {
                       const last = prev[prev.length - 1];
                       return [...prev.slice(0, -1), { role: 'assistant', content: assistantMsg }];
                    });
                  }
               } catch (e) {
                  // Final or non-JSON chunk
               }
            }
          }
        }
      }
    } catch (err) {
      console.error('Copilot Chat Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Neural connection lost. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#2e6fff] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 animate-bounce"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] ms-glass-panel flex flex-col z-[100] animate-ms-fade-in shadow-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#2e6fff]/10 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#2e6fff]/20 flex items-center justify-center text-[#2e6fff]">
             <Bot size={18} />
          </div>
          <div>
            <div className="text-[12px] font-bold text-white uppercase tracking-wider">AXON_COPILOT</div>
            <div className="text-[9px] font-mono text-emerald-400">NEURAL_LINK_STABLE</div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[80%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
               m.role === 'user' 
                ? 'bg-[#2e6fff] text-white rounded-br-none' 
                : 'bg-white/5 text-[#dde8ff] border border-white/5 rounded-bl-none'
             }`}>
               {m.content}
               {isTyping && i === messages.length - 1 && m.role === 'assistant' && (
                  <span className="inline-block w-1 h-4 bg-[#2e6fff] ml-1 animate-pulse" />
               )}
             </div>
          </div>
        ))}
        {isTyping && messages.length > 0 && messages[messages.length - 1].content === '' && (
          <div className="flex justify-start">
             <div className="bg-white/5 p-3 rounded-2xl animate-pulse flex items-center gap-2 text-[13px] text-white/50">
               <Loader2 size={14} className="animate-spin" /> Thinking...
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/40">
        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Mission directives..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-4 pr-12 text-[13px] text-white focus:outline-none focus:border-[#2e6fff]/50 transition-all font-mono"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#2e6fff] text-white flex items-center justify-center hover:bg-[#2e6fff]/80 disabled:opacity-50 transition-all"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
