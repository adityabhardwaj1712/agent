"use client";

import { useEffect, useState } from "react";
import { apiJson } from "../lib/api";

export default function AnalyticsPage() {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await apiJson<Record<string, unknown>>("/v1/analytics/metrics");
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 22 }}>Analytics</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Current metrics from the backend.
      </p>

      <button
        onClick={refresh}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.06)",
          color: "#e5e7eb",
        }}
      >
        {loading ? "Refreshing..." : "Refresh"}
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
          minHeight: 220,
        }}
      >
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  );
}

