"use client";
/**
 * POWER-UP 4: ChatInterface with real WebSocket streaming.
 * Drop this in as a replacement for frontend/app/components/ChatInterface.tsx
 *
 * What changed vs the original:
 *  - handleSend() calls the real POST /tasks/submit endpoint
 *  - Opens a WebSocket to /ws/tasks/{taskId} immediately after
 *  - Streams status, trace, and result events into the message bubble in real time
 *  - Thought process expander shows live trace steps as they arrive
 *  - Graceful fallback if WebSocket is unavailable
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Sparkles, ChevronDown, ChevronUp, Zap, AlertCircle } from "lucide-react";
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
  return { thinking: "Planning…", executing: "Executing…", complete: "Done", error: "Error", approval: "Awaiting approval" }[s] ?? s;
}

function statusColor(s: MsgStatus): string {
  return { complete: "text-green-400", error: "text-red-400", approval: "text-yellow-400" }[s] ?? "text-blue-400";
}

const WS_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws");

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your AgentCloud assistant. Submit a goal and I'll dispatch agents to complete it in real time.",
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

  // Clean up all WebSockets on unmount
  useEffect(() => {
    return () => wsRefs.current.forEach((ws) => ws.close());
  }, []);

  // ── Update a single message by id ────────────────────────────────────────
  const updateMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  // ── Open WebSocket for a task ─────────────────────────────────────────────
  const openTaskStream = useCallback(
    (msgId: string, taskId: string) => {
      const token = window.localStorage.getItem("agentcloud_token") ?? "";
      const url = `${WS_BASE}/ws/tasks/${taskId}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRefs.current.set(msgId, ws);

      ws.onopen = () => updateMessage(msgId, { status: "executing" });

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as Record<string, unknown>;

          if (msg.type === "trace") {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== msgId) return m;
                const traces = [...(m.traces ?? []), { step: String(msg.step ?? ""), timestamp: String(msg.timestamp ?? "") }];
                return { ...m, traces };
              })
            );
          } else if (msg.type === "status") {
            const st = String(msg.status ?? "");
            if (st === "pending_approval") updateMessage(msgId, { status: "approval", content: "⚠️ This task requires human approval before continuing. Visit the Approvals page." });
            else if (st === "failed") updateMessage(msgId, { status: "error", content: "The task failed. Check the Traces dashboard for details." });
          } else if (msg.type === "result") {
            updateMessage(msgId, {
              status: "complete",
              content: String(msg.result ?? "Task completed."),
              thought: String(msg.thought_process ?? ""),
            });
            ws.close();
          } else if (msg.type === "error") {
            updateMessage(msgId, { status: "error", content: `Error: ${msg.message}` });
            ws.close();
          }
        } catch {
          /* ignore parse errors */
        }
      };

      ws.onerror = () => updateMessage(msgId, { status: "error", content: "Lost connection to agent. Check the Traces dashboard." });
      ws.onclose = () => wsRefs.current.delete(msgId);
    },
    [updateMessage]
  );

  // ── Submit a task ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "Planning your request…",
      status: "thinking",
      traces: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // POST the task to the backend
      const result = await apiJson<{ task_id: string }>("/tasks/submit", {
        method: "POST",
        json: { payload: userMsg.content },
      });

      if (!result.ok) {
        updateMessage(assistantId, { status: "error", content: `Failed to submit task: ${JSON.stringify(result.error)}` });
        return;
      }

      const taskId = result.data.task_id;
      updateMessage(assistantId, { taskId, status: "executing", content: `Task dispatched — ID: ${taskId}` });
      openTaskStream(assistantId, taskId);
    } catch (err) {
      updateMessage(assistantId, { status: "error", content: `Network error: ${String(err)}` });
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

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="ac-chat-container">
      {/* Header */}
      <div className="ac-chat-header">
        <div className="flex items-center gap-3">
          <div className="ac-status-dot ac-status-online" />
          <h2 className="text-lg font-semibold flex items-center gap-2">
            AgentCloud Terminal <Sparkles size={16} className="text-blue-400" />
          </h2>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Zap size={10} className="text-green-400" /> Live streaming active
        </div>
      </div>

      {/* Messages */}
      <div className="ac-chat-messages" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`ac-message-wrapper ${msg.role === "user" ? "ac-message-user" : "ac-message-bot"}`}>
            <div className="ac-message-icon">
              {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="ac-message-bubble">
              {/* Content */}
              <div className="ac-message-content">{msg.content}</div>

              {/* Status pill */}
              {msg.status && msg.status !== "complete" && (
                <div className={`ac-status-pill mt-2 ${statusColor(msg.status)}`}>
                  {msg.status !== "error" && msg.status !== "approval" && <div className="ac-spinner-xs mr-2" />}
                  {msg.status === "error" && <AlertCircle size={12} className="mr-2" />}
                  {statusLabel(msg.status)}
                </div>
              )}

              {/* Live traces */}
              {msg.traces && msg.traces.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => toggleTraces(msg.id)}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                  >
                    {expandedTraces.has(msg.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {msg.traces.length} trace step{msg.traces.length !== 1 ? "s" : ""}
                  </button>
                  {expandedTraces.has(msg.id) && (
                    <div className="ac-thought-block mt-1 max-h-40 overflow-y-auto text-xs space-y-1">
                      {msg.traces.map((t, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-500 shrink-0">{t.timestamp?.split("T")[1]?.slice(0, 8) ?? "—"}</span>
                          <span>{t.step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Thought process (after completion) */}
              {msg.thought && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => toggleTraces(`thought-${msg.id}`)}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                  >
                    {expandedTraces.has(`thought-${msg.id}`) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Internal reasoning
                  </button>
                  {expandedTraces.has(`thought-${msg.id}`) && (
                    <div className="ac-thought-block mt-1 text-xs whitespace-pre-wrap">{msg.thought}</div>
                  )}
                </div>
              )}

              {/* Task ID badge */}
              {msg.taskId && (
                <div className="mt-2 text-[10px] text-slate-500">
                  Task ID: <code className="font-mono">{msg.taskId}</code>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
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

      {/* Input */}
      <div className="ac-chat-input-area">
        <textarea
          className="ac-chat-input"
          placeholder="Type a goal — e.g. 'Search for the latest AI news and write a summary'…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          rows={1}
          disabled={isLoading}
        />
        <button className="ac-chat-send" onClick={handleSend} disabled={isLoading}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
