"use client";

import { useState } from "react";
import { apiJson } from "../lib/api";

type MemoryWriteResponse = { status: string; memory_id: string };
type MemoryRow = { memory_id: string; agent_id: string; content: string; created_at?: string };

export default function MemoryPage() {
  const [agentId, setAgentId] = useState("");
  const [content, setContent] = useState("hello world memory");
  const [query, setQuery] = useState("hello");
  const [writeResult, setWriteResult] = useState<unknown>(null);
  const [searchResult, setSearchResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function onWrite() {
    setLoading(true);
    try {
      const r = await apiJson<MemoryWriteResponse>("/v1/memory/write", {
        method: "POST",
        json: { agent_id: agentId, content },
      });
      setWriteResult(r);
    } finally {
      setLoading(false);
    }
  }

  async function onSearch() {
    setLoading(true);
    try {
      const r = await apiJson<MemoryRow[]>(
        `/v1/memory/search?q=${encodeURIComponent(query)}&agent_id=${encodeURIComponent(agentId)}`
      );
      setSearchResult(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 22 }}>Memory</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Write and search memories (stored in Postgres).
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 }}>
          <div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: 15 }}>Write</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
            />
            <button
              onClick={onWrite}
              disabled={loading || !agentId.trim()}
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(34,197,94,0.18)",
                color: "#e5e7eb",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Working..." : "Write memory"}
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
              }}
            >
              {JSON.stringify(writeResult, null, 2)}
            </pre>
          </div>

          <div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: 15 }}>Search</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10 }}
            />
            <button
              onClick={onSearch}
              disabled={loading || !agentId.trim()}
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(59,130,246,0.22)",
                color: "#e5e7eb",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Working..." : "Search"}
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
              }}
            >
              {JSON.stringify(searchResult, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}

