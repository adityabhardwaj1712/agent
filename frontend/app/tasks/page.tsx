"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { apiJson, wsUrl } from "../lib/api";
import { Play, RefreshCw, Activity, Clock, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Bot, Zap } from "lucide-react";

type TaskRunResponse = { task_id: string; agent_id: string; payload: string; status: string; result?: string | null };
type TaskStatusResponse = { task_id: string; status: string; result?: string | null; thought_process?: string };
type AgentOption = { agent_id: string; name: string; role?: string };

const STATUS_COLOR: Record<string, string> = {
  completed: "#10B981", success: "#10B981",
  failed: "#EF4444", error: "#EF4444",
  processing: "#3B82F6", pending: "#F59E0B", queued: "#8B5CF6",
};

const SAMPLE_TASKS = [
  "Research the latest advancements in quantum computing and summarize key findings",
  "Write a Python function to parse JSON and validate schema",
  "Analyze this dataset and provide statistical summary",
  "Create a blog post outline about AI trends in 2026",
  "Debug this code and suggest optimizations",
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
    apiJson<AgentOption[]>("/v1/agents/my").then(r => {
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
      const r = await apiJson<TaskRunResponse>("/v1/tasks/run", {
        method: "POST",
        json: { agent_id: agentId, payload },
      });
      if (r.ok) {
        setRunResult(r.data);
        setTaskId(r.data.task_id);
        setLiveLog([`✓ Task submitted: ${r.data.task_id}`]);
        setPolling(true);
        // Try WebSocket
        try {
          const ws = new WebSocket(wsUrl(`/ws/tasks/${r.data.task_id}`));
          ws.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data);
              if (msg.type === "status") setLiveLog(p => [...p, `→ Status: ${msg.status}`]);
              if (msg.type === "trace") setLiveLog(p => [...p, `  ↳ ${msg.step}`]);
              if (msg.type === "result") {
                setStatusResult({ task_id: r.data.task_id, status: "completed", result: msg.result });
                setPolling(false);
                ws.close();
              }
            } catch {}
          };
          ws.onerror = () => { /* fallback to polling */ };
        } catch {}
      } else {
        setLiveLog([`✗ Error: ${(r.error as any)?.detail || "Unknown error"}`]);
      }
    } finally {
      setLoading(false);
    }
  }

  const refreshStatus = useCallback(async (id?: string) => {
    const tid = (id ?? taskId).trim();
    if (!tid) return;
    const r = await apiJson<TaskStatusResponse>(`/v1/tasks/${encodeURIComponent(tid)}`);
    if (r.ok) {
      setStatusResult(r.data);
      if (["completed", "success", "failed", "error"].includes(r.data.status?.toLowerCase())) {
        setPolling(false);
        setLiveLog(p => [...p, `✓ Final status: ${r.data.status}`]);
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

  const statusColor = STATUS_COLOR[(statusResult?.status || runResult?.status || "").toLowerCase()] || "var(--text-tertiary)";
  const isDone = statusResult && ["completed", "success", "failed", "error"].includes(statusResult.status?.toLowerCase());

  return (
    <div style={{ maxWidth: 900, animation: "slideUp 0.4s ease-out" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Tasks</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 5 }}>Submit tasks to agents and monitor execution in real time</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Submit Panel */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-muted)", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={16} style={{ color: "var(--accent-primary)" }} /> Submit Task
          </h2>

          {/* Agent selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Agent</label>
            {agents.length > 0 ? (
              <select
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
                  background: "var(--bg-input)", border: "1px solid var(--border-active)",
                  color: "var(--text-primary)", outline: "none", cursor: "pointer"
                }}
              >
                {agents.map(a => (
                  <option key={a.agent_id} value={a.agent_id}>{a.name}{a.role ? ` · ${a.role}` : ""}</option>
                ))}
              </select>
            ) : (
              <input
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                placeholder="Paste agent_id..."
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
                  background: "var(--bg-input)", border: "1px solid var(--border-active)",
                  color: "var(--text-primary)", outline: "none"
                }}
              />
            )}
          </div>

          {/* Sample tasks */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Examples</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {SAMPLE_TASKS.slice(0, 3).map((t, i) => (
                <button
                  key={i}
                  onClick={() => setPayload(t)}
                  style={{
                    textAlign: "left", padding: "7px 10px", borderRadius: 8,
                    background: payload === t ? "rgba(59,130,246,0.1)" : "var(--bg-tertiary)",
                    border: `1px solid ${payload === t ? "rgba(59,130,246,0.3)" : "var(--border-muted)"}`,
                    color: payload === t ? "var(--accent-primary)" : "var(--text-secondary)",
                    cursor: "pointer", fontSize: 11, fontWeight: payload === t ? 600 : 400,
                    transition: "all 0.15s", lineHeight: 1.4
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Payload */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Task Payload</label>
            <textarea
              value={payload}
              onChange={e => setPayload(e.target.value)}
              placeholder="Describe what you want the agent to do..."
              rows={4}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
                background: "var(--bg-input)", border: "1px solid var(--border-active)",
                color: "var(--text-primary)", outline: "none", resize: "vertical",
                fontFamily: "inherit", lineHeight: 1.5
              }}
            />
          </div>

          <button
            onClick={onRun}
            disabled={!canRun || loading}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
              background: !canRun || loading ? "rgba(59,130,246,0.3)" : "var(--accent-primary)",
              color: "white", cursor: !canRun || loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              boxShadow: canRun && !loading ? "0 4px 14px rgba(59,130,246,0.4)" : "none"
            }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Running...</> : <><Play size={16} /> Run Task</>}
          </button>
        </div>

        {/* Results Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Live Log */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-muted)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={14} style={{ color: polling ? "#10B981" : "var(--text-tertiary)" }} />
                Live Log
                {polling && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />}
              </h2>
              {taskId && (
                <button onClick={() => refreshStatus()} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--accent-primary)", fontSize: 11, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4
                }}>
                  <RefreshCw size={11} /> Refresh
                </button>
              )}
            </div>
            <div style={{
              fontFamily: "monospace", fontSize: 11, lineHeight: 1.7,
              background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "10px 12px",
              minHeight: 80, maxHeight: 140, overflowY: "auto",
              color: "var(--text-secondary)"
            }}>
              {liveLog.length === 0
                ? <span style={{ color: "var(--text-tertiary)" }}>Awaiting task submission…</span>
                : liveLog.map((l, i) => <div key={i}>{l}</div>)
              }
            </div>
          </div>

          {/* Status + Result */}
          {(runResult || statusResult) && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-muted)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>Result</h2>
                <span style={{
                  padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30`
                }}>
                  {statusResult?.status || runResult?.status || "—"}
                </span>
              </div>

              {statusResult?.result && (
                <div style={{
                  background: "var(--bg-tertiary)", borderRadius: 8, padding: "10px 12px",
                  fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10
                }}>
                  {statusResult.result}
                </div>
              )}

              {statusResult?.thought_process && (
                <div>
                  <button
                    onClick={() => setShowThought(p => !p)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-tertiary)", fontSize: 11, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 4, padding: 0
                    }}
                  >
                    {showThought ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Thought Process
                  </button>
                  {showThought && (
                    <div style={{
                      marginTop: 8, fontFamily: "monospace", fontSize: 11, lineHeight: 1.7,
                      background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "10px 12px",
                      color: "#64748b", fontStyle: "italic"
                    }}>
                      {statusResult.thought_process}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
