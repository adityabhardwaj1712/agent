import ProtocolGraph from "./components/ProtocolGraph";

export default async function Home() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  let pulse = { active_agents: 142, token_velocity: "4.1k/s", success_rate: "99.8%", success_rate_numeric: 99.8 };
  let incidents: any[] = [];
  let traces: any[] = [];

  try {
    const [pulseRes, incidentsRes, tracesRes] = await Promise.all([
      fetch(`${base}/v1/analytics/fleet-pulse`, { cache: "no-store" }).catch(() => null),
      fetch(`${base}/v1/analytics/incidents`, { cache: "no-store" }).catch(() => null),
      fetch(`${base}/v1/traces`, { cache: "no-store" }).catch(() => null),
    ]);

    if (pulseRes?.ok) pulse = await pulseRes.json();
    if (incidentsRes?.ok) incidents = await incidentsRes.json();
    if (tracesRes?.ok) traces = await tracesRes.json();
  } catch (e) {
    // Use fallback data
  }

  // Fallback incidents
  if (incidents.length === 0) {
    incidents = [
      { agent: "Agent: Claude-3.5", task: "Analyze Document", seen: "1 days ago", status: "Removed" },
      { agent: "Agent: GPT-4o", task: "Analyze Document", seen: "1 days ago", status: "Removed" },
    ];
  }

  return (
    <main>
      {/* ═══════════ FLEET PULSE ═══════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 className="ac-section-title">Fleet Pulse</h2>
        <div className="ac-section-badge">
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
          #10A5FF
        </div>
      </div>

      <section className="ac-kpi-row">
        {/* Active Agents */}
        <div className="ac-kpi-card">
          <div className="ac-kpi-label">Active Agents</div>
          <div className="ac-kpi-value">
            {pulse.active_agents}
            <span className="ac-kpi-dot" />
          </div>
        </div>

        {/* Token Velocity */}
        <div className="ac-kpi-card">
          <div className="ac-kpi-label">Token Velocity</div>
          <div className="ac-kpi-value">{pulse.token_velocity}</div>
        </div>

        {/* Success Rate */}
        <div className="ac-kpi-card">
          <div className="ac-kpi-label">Success Rate</div>
          <div className="ac-kpi-value">
            {pulse.success_rate}
            <span className="ac-kpi-dot" />
          </div>
          <div className="ac-kpi-bar">
            <div className="ac-kpi-bar-fill" style={{ width: `${pulse.success_rate_numeric}%` }} />
          </div>
        </div>
      </section>

      {/* ═══════════ ACTIVE FLEET PULSE (ACP) ═══════════ */}
      <div className="ac-fleet-card">
        <div className="ac-fleet-card-header">
          <div>
            <div className="ac-card-subtitle">Active Fleet Pulse</div>
            <div className="ac-card-foot">Agent Communication Protocol (ACP) Live Feed</div>
          </div>
          <div className="ac-pill">Real-time</div>
        </div>
        <div className="ac-graph-area">
          <ProtocolGraph events={traces} />
        </div>
      </div>

      {/* ═══════════ INCIDENT MANAGEMENT ═══════════ */}
      <div className="ac-fleet-card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="ac-card-subtitle">Agent Incident Management</div>
            <div className="ac-card-foot">Recent anomalies and mitigations.</div>
          </div>
          <div className="ac-badge-danger">Circuit Breaker</div>
        </div>

        <table className="ac-table">
          <thead>
            <tr>
              <th>Anomalous Agents</th>
              <th>Task</th>
              <th>Status</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc: any, idx: number) => (
              <tr key={idx}>
                <td>{inc.agent}</td>
                <td>{inc.task}</td>
                <td>{inc.seen}</td>
                <td>
                  <span className={inc.status === "Removed" ? "ac-pill-danger" : "ac-pill-warning"}>
                    {inc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
