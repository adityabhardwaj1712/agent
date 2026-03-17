"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thought?: string;
  status?: "thinking" | "executing" | "complete";
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am your AgentCloud assistant. How can I help you orchestrate your autonomous agents today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedThought, setExpandedThought] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate Agent Reasoning & Execution
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've started planning your request. I'll deploy the Research Agent and the Analyst Agent to complete this goal.",
        thought: "User requested a complex task. Plan: 1. Research current trends. 2. Synthesize with Analyst. 3. Output report.",
        status: "thinking"
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
      
      // Simulate follow-up update
      setTimeout(() => {
        setMessages(prev => prev.map(m => 
          m.id === assistantMsg.id 
          ? { ...m, status: "complete", content: "I have successfully deployed the agents. You can track their real-time progress in the Traces dashboard." } 
          : m
        ));
      }, 3000);
    }, 1500);
  };

  return (
    <div className="ac-chat-container">
      <div className="ac-chat-header">
        <div className="flex items-center gap-3">
          <div className="ac-status-dot ac-status-online" />
          <h2 className="text-lg font-semibold flex items-center gap-2">
            AgentCloud Terminal <Sparkles size={16} className="text-blue-400" />
          </h2>
        </div>
        <div className="text-xs text-slate-400">WebSocket Connected: ACP 2.0</div>
      </div>

      <div className="ac-chat-messages" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`ac-message-wrapper ${msg.role === "user" ? "ac-message-user" : "ac-message-bot"}`}>
            <div className="ac-message-icon">
              {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="ac-message-bubble">
              <div className="ac-message-content">{msg.content}</div>
              
              {msg.thought && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <button 
                    onClick={() => setExpandedThought(expandedThought === msg.id ? null : msg.id)}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                  >
                    {expandedThought === msg.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Internal Reasoning
                  </button>
                  {expandedThought === msg.id && (
                    <div className="ac-thought-block">
                      {msg.thought}
                    </div>
                  )}
                </div>
              )}

              {msg.status && msg.status !== "complete" && (
                <div className="ac-status-pill mt-2">
                  <div className="ac-spinner-xs mr-2" />
                  {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}...
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="ac-message-wrapper ac-message-bot">
            <div className="ac-message-icon"><Bot size={18} /></div>
            <div className="ac-message-bubble py-3 px-4 flex gap-1">
              <div className="ac-typing-dot" />
              <div className="ac-typing-dot" />
              <div className="ac-typing-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="ac-chat-input-area">
        <textarea
          className="ac-chat-input"
          placeholder="Type a goal (e.g., 'Analyze the current stock market and write a summary')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          rows={1}
        />
        <button className="ac-chat-send" onClick={handleSend}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
