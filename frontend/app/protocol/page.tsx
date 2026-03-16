"use client";

import { useState } from "react";
import { apiJson } from "../lib/api";

type ProtocolResponse = { message_id: string; status: string };

export default function ProtocolPage() {
  const [fromAgentId, setFromAgentId] = useState("");
  const [toAgentId, setToAgentId] = useState("");
  const [type, setType] = useState("message");
  const [payload, setPayload] = useState("hello");
  const [correlationId, setCorrelationId] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function onSend() {
    setLoading(true);
    try {
      const r = await apiJson<ProtocolResponse>("/v1/protocol/send", {
        method: "POST",
        json: {
          from_agent_id: fromAgentId,
          to_agent_id: toAgentId,
          type,
          payload,
          correlation_id: correlationId || null,
        },
      });
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 22 }}>Protocol</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Send an agent-to-agent message. Requires scope <code>SEND_PROTOCOL</code>{" "}
        and the token’s agent must match <code>from_agent_id</code>.
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
              From agent_id
            </label>
            <input
              value={fromAgentId}
              onChange={(e) => setFromAgentId(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
              To agent_id
            </label>
            <input
              value={toAgentId}
              onChange={(e) => setToAgentId(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginTop: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
              Type
            </label>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
              Correlation ID (optional)
            </label>
            <input
              value={correlationId}
              onChange={(e) => setCorrelationId(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
            />
          </div>
        </div>

        <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginTop: 12 }}>
          Payload
        </label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={4}
          style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
        />

        <button
          onClick={onSend}
          disabled={loading || !fromAgentId.trim() || !toAgentId.trim()}
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(34,197,94,0.18)",
            color: "#e5e7eb",
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>

        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: "rgba(0,0,0,0.35)",
            overflow: "auto",
            fontSize: 12,
            lineHeight: 1.4,
            minHeight: 140,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      </section>
    </main>
  );
}

