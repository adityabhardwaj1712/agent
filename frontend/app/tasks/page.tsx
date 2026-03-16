"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../lib/api";

type TaskRunResponse = {
  task_id: string;
  agent_id: string;
  payload: string;
  status: string;
  result?: string | null;
};

type TaskStatusResponse = {
  task_id: string;
  status: string;
  result?: string | null;
};

export default function TasksPage() {
  const [agentId, setAgentId] = useState("");
  const [payload, setPayload] = useState("do a simple task");
  const [taskId, setTaskId] = useState<string>("");
  const [runResult, setRunResult] = useState<unknown>(null);
  const [statusResult, setStatusResult] = useState<unknown>(null);
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(false);

  const canRun = useMemo(() => agentId.trim().length > 0 && payload.trim().length > 0, [agentId, payload]);

  async function onRun() {
    setLoading(true);
    setStatusResult(null);
    try {
      const r = await apiJson<TaskRunResponse>("/v1/tasks/run", {
        method: "POST",
        json: { agent_id: agentId, payload },
      });
      setRunResult(r);
      if (r.ok) setTaskId(r.data.task_id);
    } finally {
      setLoading(false);
    }
  }

  async function onRefreshStatus(id?: string) {
    const tid = (id ?? taskId).trim();
    if (!tid) return;
    const r = await apiJson<TaskStatusResponse>(`/v1/tasks/${encodeURIComponent(tid)}`);
    setStatusResult(r);
  }

  useEffect(() => {
    if (!polling || !taskId.trim()) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await onRefreshStatus(taskId);
      if (cancelled) return;
      setTimeout(tick, 1500);
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling, taskId]);

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 22 }}>Tasks</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Run a task (Celery) and poll status.
      </p>

      <section
        style={{
          marginTop: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 16,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
          Agent ID
        </label>
        <input
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          placeholder="Paste agent_id from Agents page"
          style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
        />

        <label
          style={{ display: "block", fontSize: 12, opacity: 0.8, marginTop: 12 }}
        >
          Payload
        </label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={4}
          style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button
            onClick={onRun}
            disabled={loading || !canRun}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(59,130,246,0.22)",
              color: "#e5e7eb",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Run task"}
          </button>

          <button
            onClick={() => onRefreshStatus()}
            disabled={!taskId.trim()}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "#e5e7eb",
            }}
          >
            Refresh status
          </button>

          <label style={{ display: "flex", gap: 8, alignItems: "center", opacity: 0.85 }}>
            <input
              type="checkbox"
              checked={polling}
              onChange={(e) => setPolling(e.target.checked)}
            />
            Auto-poll
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 }}>
          <div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: 15 }}>Run result</h2>
            <pre
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 10,
                background: "rgba(0,0,0,0.35)",
                overflow: "auto",
                fontSize: 12,
                lineHeight: 1.4,
                minHeight: 140,
              }}
            >
              {JSON.stringify(runResult, null, 2)}
            </pre>
          </div>
          <div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: 15 }}>
              Status {taskId ? <span style={{ opacity: 0.7 }}>(task_id: {taskId})</span> : null}
            </h2>
            <pre
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 10,
                background: "rgba(0,0,0,0.35)",
                overflow: "auto",
                fontSize: 12,
                lineHeight: 1.4,
                minHeight: 140,
              }}
            >
              {JSON.stringify(statusResult, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}

