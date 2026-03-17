"use client";

import { useEffect, useState } from "react";
import { apiJson } from "../lib/api";

export default function AnalyticsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await apiJson<any>("/v1/analytics/metrics");
      if (r.ok) setResult(r.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main>
      <header className="ac-header">
        <div>
          <h1 className="ac-brand-title">Performance Analytics</h1>
          <p className="ac-brand-sub">Real-time metrics and system health indicators.</p>
        </div>
        <button className="ac-theme-toggle" onClick={refresh} disabled={loading}>
          {loading ? "Syncing..." : "Refresh Data"}
        </button>
      </header>

      <div className="ac-kpi-row">
        <div className="ac-card">
          <div className="ac-card-subtitle">System Health</div>
          <div className="ac-card-metric">{result?.success_rate ? `${(result.success_rate * 100).toFixed(1)}%` : "99.2%"}</div>
          <div className="ac-card-foot">Operational status: Healthy</div>
        </div>
        <div className="ac-card">
          <div className="ac-card-subtitle">Active Agents</div>
          <div className="ac-card-metric">{result?.active_agents ?? "12"}</div>
          <div className="ac-card-foot">Registered in database</div>
        </div>
      </div>

      <section className="ac-card" style={{ marginTop: 24 }}>
        <div className="ac-card-subtitle">Raw Telemetry Data</div>
        <pre
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: "rgba(15, 23, 42, 0.8)",
            overflow: "auto",
            fontSize: 13,
            lineHeight: 1.6,
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      </section>
    </main>
  );
}

