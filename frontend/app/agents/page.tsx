"use client";

import { useState } from "react";
import { apiJson } from "../lib/api";

type RegisterResponse = {
  agent_id: string;
  name: string;
  owner_id: string;
  token?: string | null;
};

export default function AgentsPage() {
  const [name, setName] = useState("demo-agent");
  const [ownerId, setOwnerId] = useState("demo-owner");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setLoading(true);
    try {
      const r = await apiJson<RegisterResponse>("/v1/agents/register", {
        method: "POST",
        json: { name, owner_id: ownerId },
      });
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 22 }}>Agents</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Register an agent to get an `agent_id` and JWT token.
      </p>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <h2 style={{ margin: "0 0 12px 0", fontSize: 15 }}>
            Register agent
          </h2>

          <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
          />

          <label
            style={{ display: "block", fontSize: 12, opacity: 0.8, marginTop: 12 }}
          >
            Owner ID
          </label>
          <input
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
          />

          <button
            onClick={onRegister}
            disabled={loading}
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(59,130,246,0.22)",
              color: "#e5e7eb",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </section>

        <section
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <h2 style={{ margin: "0 0 12px 0", fontSize: 15 }}>Result</h2>
          <pre
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 10,
              background: "rgba(0,0,0,0.35)",
              overflow: "auto",
              fontSize: 12,
              lineHeight: 1.4,
              minHeight: 160,
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}

