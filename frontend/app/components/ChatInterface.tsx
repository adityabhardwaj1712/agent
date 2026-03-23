'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  AlertCircle,
  Terminal,
  Cpu,
  ShieldCheck,
  Activity,
  History,
  Command
} from "lucide-react";
import { apiJson } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgStatus = "thinking" | "executing" | "complete" | "error" | "approval";

interface TraceStep {
  step: string;
  timestamp: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: MsgStatus;
  taskId?: string;
  traces?: TraceStep[];
  thought?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(s: MsgStatus): string {
  return { 
    thinking: "PLANNING_SEQUENCE", 
    executing: "EXECUTING_OPS", 
    complete: "MISSION_SUCCESS", 
    error: "CRITICAL_FAILURE", 
    approval: "AWAITING_AUTH" 
  }[s] ?? s;
}

function statusColor(s: MsgStatus): string {
  return { 
    complete: "#34D399", 
    error: "#F87171", 
    approval: "#FBBF24" 
  }[s] ?? "var(--accent-primary)";
}

const WS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws");

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "AXON Terminal initialized. Ready for command dispatch. Submit a mission objective to begin.",
      status: "complete",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRefs = useRef<Map<string, WebSocket>>(new Map());

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => wsRefs.current.forEach((ws) => ws.close());
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const openTaskStream = useCallback(
    (msgId: string, taskId: string) => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("agentcloud_token") ?? "" : "";
      const url = `${WS_BASE}/ws/tasks/${taskId}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRefs.current.set(msgId, ws);

      ws.onopen = () => updateMessage(msgId, { status: "executing" });

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "trace") {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== msgId) return m;
                const traces = [...(m.traces ?? []), { step: String(msg.step ?? ""), timestamp: new Date().toISOString() }];
                return { ...m, traces };
              })
            );
          } else if (msg.type === "status") {
            const st = String(msg.status ?? "");
            if (st === "pending_approval") updateMessage(msgId, { status: "approval", content: "SYSTEM_HOLD: Human authorization required. Visit Governance Dashboard." });
            else if (st === "failed") updateMessage(msgId, { status: "error", content: "MISSION_ABORTED: Execution failure detected." });
          } else if (msg.type === "result") {
            updateMessage(msgId, {
              status: "complete",
              content: String(msg.result ?? "Mission objectives secured."),
              thought: String(msg.thought_process ?? ""),
            });
            ws.close();
          } else if (msg.type === "error") {
            updateMessage(msgId, { status: "error", content: `ENCRYPTION_ERROR: ${msg.message}` });
            ws.close();
          }
        } catch (e) { console.error("Parse failure", e); }
      };

      ws.onerror = () => updateMessage(msgId, { status: "error", content: "SIGNAL_LOST: Connection to agent severed." });
      ws.onclose = () => wsRefs.current.delete(msgId);
    },
    [updateMessage]
  );

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "SIGNAL_ACQUIRED: Initializing mission logic...",
      status: "thinking",
      traces: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await apiJson<{ task_id: string }>("/tasks/submit", {
        method: "POST",
        json: { payload: userMsg.content },
      });

      if (!result.ok) {
        updateMessage(assistantId, { status: "error", content: "SUBMISSION_VOID: Gateway rejected the request." });
        return;
      }

      const taskId = result.data.task_id;
      updateMessage(assistantId, { taskId, status: "executing", content: `UPLINK_ESTABLISHED: TASK_ID_${taskId.substring(0, 8)}` });
      openTaskStream(assistantId, taskId);
    } catch (err) {
      updateMessage(assistantId, { status: "error", content: "NETWORK_ISOLATION: Unable to reach command center." });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTraces = (id: string) => {
    setExpandedTraces((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full glass-card rounded-3xl overflow-hidden shadow-2xl animate-slide-in" style={{ background: 'var(--bg-card)', borderColor: 'var(--card-border)' }}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse" />
          <h2 className="text-[11px] font-black text-primary tracking-[0.3em] uppercase flex items-center gap-3">
            AXON_TERMINAL <Sparkles size={14} className="text-indigo-500 animate-pulse" />
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-[9px] font-black text-tertiary tracking-[0.2em] uppercase">
            <Zap size={14} className="text-green-500" />
            SECURE_LINK_ACTIVE
          </div>
          <button className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-tertiary hover:bg-white/5 hover:text-primary transition-all">
            <History size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-10 flex flex-col gap-10 scrollbar-hide bg-gradient-to-b from-transparent to-black/5"
      >
        {messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-in`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className={`flex items-start gap-6 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-all ${
                msg.role === 'user' 
                ? 'gradient-bg text-white' 
                : 'bg-white/5 border border-white/10 text-indigo-400 group-hover:border-indigo-500/40'
              }`}>
                {msg.role === 'user' ? <User size={24} /> : <Bot size={24} />}
              </div>
              
              <div className={`relative px-7 py-6 rounded-[2rem] border transition-all ${
                msg.role === 'user' 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-primary shadow-[0_8px_32px_rgba(99,102,241,0.1)]' 
                : 'glass-card border-white/10 text-primary shadow-[0_24px_48px_rgba(0,0,0,0.3)]'
              }`}>
                <div className="text-[15px] leading-relaxed font-black tracking-tight uppercase opacity-90">
                   {msg.content}
                </div>

                {msg.status && msg.status !== "complete" && (
                  <div className="mt-5 flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: statusColor(msg.status) }}>
                    <div className="p-1.5 rounded-lg bg-current/10">
                       {msg.status === 'thinking' || msg.status === 'executing' ? (
                         <Terminal size={14} className="animate-pulse" />
                       ) : msg.status === 'error' ? (
                           <AlertCircle size={14} />
                       ) : <ShieldCheck size={14} />}
                    </div>
                    {statusLabel(msg.status)}
                  </div>
                )}

                {msg.traces && msg.traces.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-white/5">
                    <button
                      onClick={() => toggleTraces(msg.id)}
                      className="flex items-center gap-3 text-[10px] font-black text-tertiary tracking-[0.3em] hover:text-indigo-400 transition-all uppercase opacity-40 hover:opacity-100"
                    >
                      {expandedTraces.has(msg.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      METADATA_EXTRACT ({msg.traces.length})
                    </button>
                    {expandedTraces.has(msg.id) && (
                      <div className="mt-4 p-5 bg-black/60 rounded-2xl font-mono text-[11px] text-tertiary/60 max-h-[250px] overflow-y-auto border border-white/5 custom-scrollbar backdrop-blur-md">
                        {msg.traces.map((t, i) => (
                          <div key={i} className="mb-3 flex gap-4 hover:text-tertiary transition-colors">
                            <span className="text-indigo-500 font-bold shrink-0">[{new Date(t.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                            <span className="leading-tight uppercase">{t.step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {msg.thought && (
                   <div className="mt-6 pt-5 border-t border-white/5">
                    <button
                      onClick={() => toggleTraces(`thought-${msg.id}`)}
                      className="flex items-center gap-3 text-[10px] font-black text-tertiary tracking-[0.3em] hover:text-indigo-400 transition-all uppercase opacity-40 hover:opacity-100"
                    >
                      {expandedTraces.has(`thought-${msg.id}`) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      NEURAL_REASONING_ENGINE
                    </button>
                    {expandedTraces.has(`thought-${msg.id}`) && (
                      <div className="mt-4 p-6 bg-indigo-500/[0.05] border border-indigo-500/20 rounded-2xl text-[13px] font-black italic leading-loose tracking-tight uppercase opacity-80" style={{ color: 'var(--text-secondary)' }}>
                         {msg.thought}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-6 animate-pulse">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
                <Cpu size={24} className="animate-spin" />
              </div>
              <div className="flex gap-2 p-5 items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
              </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-8 border-t border-white/5 bg-black/20">
        <div className="relative group max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[50px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center p-3 bg-white/5 border border-white/10 rounded-[2rem] group-focus-within:border-indigo-500/40 group-focus-within:shadow-[0_0_50px_rgba(99,102,241,0.1)] transition-all">
            <div className="px-5 text-tertiary shrink-0 opacity-30">
              <Command size={20} />
            </div>
            <textarea
              className="flex-1 bg-transparent border-none outline-none py-4 text-[15px] font-black tracking-tight uppercase resize-none scrollbar-hide leading-normal h-[54px] placeholder:opacity-20 translate-y-[2px]"
              placeholder="Initialize command sequence..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              rows={1}
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all ${
                input.trim() 
                ? 'gradient-bg text-white shadow-[0_16px_32px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95' 
                : 'bg-white/5 text-tertiary cursor-not-allowed opacity-30'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-12 opacity-30">
          <div className="flex items-center gap-3 text-[10px] font-black text-tertiary tracking-[0.2em] uppercase">
            <span className="text-indigo-500 border border-white/10 px-2 py-1 rounded bg-white/5">SHIFT + ENTER</span> NEW_LINE
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black text-tertiary tracking-[0.2em] uppercase">
            <span className="text-indigo-500 border border-white/10 px-2 py-1 rounded bg-white/5">ENTER</span> DISPATCH
          </div>
        </div>
      </div>
    </div>
  );
}
