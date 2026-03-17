"use client";

import { useEffect, useState } from "react";
import { apiJson } from "../lib/api";

type AuditLog = {
  log_id: string;
  agent_id: string | null;
  action: string;
  method: string;
  path: string;
  status_code: string | null;
  created_at: string;
  detail: string | null;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      // Note: We need a backend endpoint for this. 
      // For now, we'll try to fetch from /v1/audit/ (assuming we'll add it)
      // or show a friendly placeholder if it's not there.
      const res = await apiJson<AuditLog[]>("/v1/audit/logs");
      if (res.ok) {
        setLogs(res.data);
      }
      setLoading(false);
    }
    fetchLogs();
  }, []);

  return (
    <main>
      <header className="ac-header">
        <div>
          <h1 className="ac-brand-title">Audit Logs</h1>
          <p className="ac-brand-sub">Complete history of system activity and agent operations.</p>
        </div>
      </header>

      <section className="ac-card">
        {loading ? (
          <div className="ac-pulse">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="ac-section-sub">No logs found or endpoint not yet implemented.</div>
        ) : (
          <table className="ac-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>Agent</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.log_id}>
                  <td><strong>{log.action}</strong></td>
                  <td><code className="ac-chip">{log.method}</code></td>
                  <td>{log.path}</td>
                  <td>{log.status_code || "—"}</td>
                  <td>{log.agent_id || "System"}</td>
                  <td style={{ fontSize: '12px', opacity: 0.7 }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
