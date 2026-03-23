'use client';

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { apiJson, wsUrl } from "../lib/api";
import { 
  Play, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  Zap,
  Terminal,
  Cpu,
  ShieldCheck,
  Command,
  Layers,
  Sparkles
} from "lucide-react";

type TaskRunResponse = { task_id: string; agent_id: string; payload: string; status: string; result?: string | null };
type TaskStatusResponse = { task_id: string; status: string; result?: string | null; thought_process?: string };
type AgentOption = { agent_id: string; name: string; role?: string };

const STATUS_COLOR: Record<string, { color: string, bg: string, border: string }> = {
  completed: { color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.2)" },
  success: { color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.2)" },
  failed: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)" },
  error: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)" },
  processing: { color: "#6366F1", bg: "rgba(99, 102, 241, 0.1)", border: "rgba(99, 102, 241, 0.2)" },
  pending: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)" },
  queued: { color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.2)" },
};

const SAMPLE_TASKS = [
  "Research advancements in quantum computing",
  "Write a Python JSON parser with schema validation",
  "Analyze this dataset for statistical anomalies",
  "Outline AI trends for 2026",
  "Optimize this code for performance",
];

export default function TasksPage() {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [agentId, setAgentId] = useState("");
  const [payload, setPayload] = useState("");
  const [taskId, setTaskId] = useState("");
  const [runResult, setRunResult] = useState<TaskRunResponse | null>(null);
  const [statusResult, setStatusResult] = useState<TaskStatusResponse | null>(null);
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const [showThought, setShowThought] = useState(false);

  useEffect(() => {
    apiJson<AgentOption[]>("/agents/my").then(r => {
      if (r.ok && r.data.length > 0) {
        setAgents(r.data);
        setAgentId(r.data[0].agent_id);
      }
    });
  }, []);

  const canRun = useMemo(() => agentId.trim().length > 0 && payload.trim().length > 0, [agentId, payload]);

  async function onRun() {
    if (!canRun) return;
    setLoading(true);
    setStatusResult(null);
    setLiveLog([]);
    setRunResult(null);
    try {
      const r = await apiJson<TaskRunResponse>("/tasks/run", {
        method: "POST",
        json: { agent_id: agentId, payload },
      });
      if (r.ok) {
        setRunResult(r.data);
        setTaskId(r.data.task_id);
        setLiveLog([`[SYS] DISPATCH_SUCCESS: ${r.data.task_id}`]);
        setPolling(true);
        try {
          const ws = new WebSocket(wsUrl(`/tasks/${r.data.task_id}`));
          ws.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data);
              if (msg.type === "status") setLiveLog(p => [...p, `[STATUS] ${msg.status.toUpperCase()}`]);
              if (msg.type === "trace") setLiveLog(p => [...p, `[TRACE] ${msg.step}`]);
              if (msg.type === "result") {
                setStatusResult({ task_id: r.data.task_id, status: "completed", result: msg.result });
                setPolling(false);
                ws.close();
              }
            } catch {}
          };
        } catch {}
      } else {
        setLiveLog([`[ERR] DISPATCH_FAILED: ${(r.error as any)?.detail || "GATEWAY_TIMEOUT"}`]);
      }
    } finally {
      setLoading(false);
    }
  }

  const refreshStatus = useCallback(async (id?: string) => {
    const tid = (id ?? taskId).trim();
    if (!tid) return;
    const r = await apiJson<TaskStatusResponse>(`/tasks/${encodeURIComponent(tid)}`);
    if (r.ok) {
      setStatusResult(r.data);
      if (["completed", "success", "failed", "error"].includes(r.data.status?.toLowerCase())) {
        setPolling(false);
        setLiveLog(p => [...p, `[FINAL] MISSION_${r.data.status.toUpperCase()}`]);
      }
    }
  }, [taskId]);

  useEffect(() => {
    if (!polling || !taskId.trim()) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await refreshStatus(taskId);
      if (!cancelled && polling) setTimeout(tick, 2000);
    };
    tick();
    return () => { cancelled = true; };
  }, [polling, taskId, refreshStatus]);

  const status = (statusResult?.status || runResult?.status || "idle").toLowerCase();
  const statusConfig = STATUS_COLOR[status] || { color: "var(--text-tertiary)", bg: "var(--bg-tertiary)", border: "var(--card-border)" };

  return (
    <div className="max-w-[1200px] mx-auto animate-slide-in p-4 md:p-8">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-black tracking-widest uppercase">
            Mission Control
          </span>
          <span className="text-secondary text-[10px] font-bold tracking-tighter opacity-70">UPLINK_STABLE // AXON-9</span>
        </div>
        <h1 className="text-4xl font-black text-primary tracking-tighter">Command Dispatch</h1>
        <p className="text-secondary text-sm max-w-xl mt-3 leading-relaxed">
          Orchestrate autonomous agent sequences with high-precision task payloads and real-time observability across the neural network.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submit Panel */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
               <Command size={20} />
             </div>
             <h2 className="text-xl font-black text-primary uppercase tracking-tight">Dispatch Parameters</h2>
          </div>

          {/* Agent selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">Target Neural Node</label>
            <div className="relative group">
              <Bot size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-indigo-500 transition-colors" />
              <select
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-tertiary/20 border border-white/5 rounded-2xl text-sm font-bold text-primary outline-none appearance-none focus:border-indigo-500/50 transition-all cursor-pointer shadow-inner"
              >
                {agents.map(a => (
                  <option key={a.agent_id} value={a.agent_id} className="bg-slate-900">{a.name}{a.role ? ` — ${a.role}` : ""}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
            </div>
          </div>

          {/* Quick Examples */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">Template Registry</label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TASKS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setPayload(t)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                    payload === t 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-tertiary/30 text-secondary hover:bg-tertiary/50 border border-white/5"
                  }`}
                >
                  {t.length > 25 ? t.substring(0, 25) + "..." : t}
                </button>
              ))}
            </div>
          </div>

          {/* Payload */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">Mission Objective Payload</label>
            <textarea
              value={payload}
              onChange={e => setPayload(e.target.value)}
              placeholder="Define high-level autonomous goal..."
              rows={4}
              className="w-full p-5 bg-tertiary/20 border border-white/5 rounded-2xl text-sm leading-relaxed text-primary outline-none focus:border-indigo-500/50 transition-all resize-none shadow-inner scrollbar-hide"
            />
          </div>

          <button
            onClick={onRun}
            disabled={!canRun || loading}
            className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${
              !canRun || loading 
              ? "opacity-40 cursor-not-allowed bg-tertiary/50" 
              : "gradient-bg text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1"
            }`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
            {loading ? "Initializing Dispatch..." : "Execute Displacement"}
          </button>
        </div>

        {/* Results Panel */}
        <div className="flex flex-col gap-6">
          {/* Live Log */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-2xl h-[300px] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <Terminal size={14} className={polling ? "text-green-500" : "text-tertiary"} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-tertiary opacity-70">Observability Feed</span>
              </div>
              {polling && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                  <span className="text-[10px] font-black text-green-500 uppercase">Live_Telemetry</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-black/40 rounded-2xl p-4 font-mono text-[11px] overflow-y-auto space-y-2 scrollbar-hide border border-white/5">
              {liveLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 italic space-y-2">
                   <Activity size={24} />
                   <p>Awaiting Signal...</p>
                </div>
              ) : (
                liveLog.map((l, i) => (
                  <div key={i} className="flex gap-3 group">
                    <span className="text-indigo-500/50 font-bold">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className="text-slate-300 group-last:text-indigo-400 group-last:font-bold">{l}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status + Result */}
          {(runResult || statusResult) ? (
            <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-tertiary opacity-70">Mission Output</span>
                <div 
                  className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}` }}
                >
                  {status.toUpperCase()}
                </div>
              </div>

              {statusResult?.result && (
                <div className="bg-tertiary/10 border border-white/5 rounded-2xl p-6 text-sm leading-relaxed text-secondary mb-6 backdrop-blur-sm">
                  {statusResult.result}
                </div>
              )}

              {statusResult?.thought_process && (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowThought(p => !p)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
                  >
                    {showThought ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Cognitive Trace
                  </button>
                  {showThought && (
                    <div className="bg-black/20 rounded-2xl p-5 font-mono text-[11px] text-tertiary leading-loose border border-white/5 italic">
                      {statusResult.thought_process}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-[200px] glass-card rounded-3xl border border-white/5 border-dashed flex flex-col items-center justify-center gap-4 opacity-40">
              <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                <Layers size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-tertiary">Awaiting Mission Displacement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
