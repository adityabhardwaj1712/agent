export default async function Home() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const [healthRes, metricsRes] = await Promise.all([
    fetch(`${base}/`, { cache: "no-store" }),
    fetch(`${base}/v1/analytics/metrics`, { cache: "no-store" }),
  ]);
  const healthText = await healthRes.text();
  const health = { ok: healthRes.ok, status: healthRes.status, body: healthText };
  const metricsJson = metricsRes.ok ? await metricsRes.json() : null;

  return (
    <main>
      <h1 className="ac-section-title">Fleet pulse</h1>
      <p className="ac-section-sub">
        High-level heartbeat of active agents, token velocity, and overall reliability.
      </p>

      <section className="ac-kpi-row">
        <div className="ac-card">
          <div className="ac-card-subtitle">Active agents</div>
          <div className="ac-card-metric">
            {metricsJson?.active_agents ?? "—"}
          </div>
          <div className="ac-card-foot">From `/v1/analytics/metrics`.</div>
        </div>
        <div className="ac-card">
          <div className="ac-card-subtitle">Token velocity</div>
          <div className="ac-card-metric">
            {metricsJson?.tasks_last_24h
              ? `${metricsJson.tasks_last_24h} / 24h`
              : "—"}
          </div>
          <div className="ac-card-foot">Tasks processed in the last 24h.</div>
        </div>
        <div className="ac-card">
          <div className="ac-card-subtitle">Success rate</div>
          <div className="ac-card-metric">
            {metricsJson?.success_rate ?? "—"}
          </div>
          <div className="ac-card-foot">
            Auto‑healing events: {metricsJson?.auto_healing_events ?? "—"}
          </div>
        </div>
      </section>

      <div className="ac-main-grid">
        <section>
          <div className="ac-fleet-stack">
            <div className="ac-fleet-card">
              <div className="ac-fleet-card-header">
                <div>
                  <div className="ac-card-subtitle">Active fleet pulse</div>
                  <div className="ac-card-foot">Agent Communication Protocol (ACP) live feed</div>
                </div>
                <div className="ac-pill">Real-time</div>
              </div>
              <div className="ac-graph-row">
                <div className="ac-node">
                  <div className="ac-node-badge">A</div>
                  <div className="ac-node-label">Source agent</div>
                  <div className="ac-node-title">Agent: Claude-3.5</div>
                </div>
                <div className="ac-connector" />
                <div className="ac-node">
                  <div className="ac-node-badge">T</div>
                  <div className="ac-node-label">Task</div>
                  <div className="ac-node-title">Task: Analyse document</div>
                </div>
                <div className="ac-connector" />
                <div className="ac-node">
                  <div className="ac-node-badge">G</div>
                  <div className="ac-node-label">Target agent</div>
                  <div className="ac-node-title">Agent: GPT-4o</div>
                </div>
              </div>
            </div>

            <div className="ac-fleet-card">
              <div className="ac-incidents-header">
                <div>
                  <div className="ac-card-subtitle">Agent incident management</div>
                  <div className="ac-card-foot">Recent anomalies and mitigations.</div>
                </div>
                <div className="ac-badge-danger">Circuit breaker</div>
              </div>
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Anomalous agent</th>
                    <th>Task</th>
                    <th>Seen</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Agent: Claude-3.5</td>
                    <td>Analyse document</td>
                    <td>1 day ago</td>
                    <td>
                      <span className="ac-pill-danger">Removed</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Agent: GPT-4o</td>
                    <td>Analyse document</td>
                    <td>1 day ago</td>
                    <td>
                      <span className="ac-pill-danger">Removed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="ac-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="ac-card-subtitle">Backend health</div>
              <div className="ac-card-foot">Raw response from FastAPI `/`.</div>
            </div>
            <span className="ac-chip">
              <span style={{ width: 8, height: 8, borderRadius: "999px", background: "#22c55e" }} />
              {health.ok ? "Healthy" : "Degraded"}
            </span>
          </div>
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: "rgba(15,23,42,0.9)",
              overflow: "auto",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {JSON.stringify(health, null, 2)}
          </pre>
        </section>
      </div>

      <section style={{ marginTop: 18 }}>
        <div className="ac-card">
          <div className="ac-card-subtitle">Analytics snapshot</div>
          <div className="ac-card-foot">Raw `/v1/analytics/metrics` response.</div>
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: "rgba(15,23,42,0.9)",
              overflow: "auto",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {JSON.stringify(metricsJson, null, 2)}
          </pre>
        </div>
      </section>
    </main>
  );
}

