"use client";
import React, { useEffect, useState } from "react";

interface Trace {
  task_id: string;
  agent_id: string;
  count: number;
  latest: string;
}

export default function TraceExplorer() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${base}/v1/traces`)
      .then(res => res.json())
      .then(data => setTraces(data));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2">Trace Explorer</h1>
      <p className="text-secondary mb-8">Investigate every execution step across your agent fleet.</p>

      <div className="ac-card p-0 overflow-hidden">
        <table className="ac-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Agent</th>
              <th>Events</th>
              <th>Latest Activity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {traces.map((trace) => (
              <tr key={trace.task_id} className="hover:bg-white/5 transition-colors">
                <td className="font-mono text-xs">{trace.task_id}</td>
                <td className="text-xs">{trace.agent_id || "System"}</td>
                <td>
                  <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full text-[10px] font-bold">
                    {trace.count} steps
                  </span>
                </td>
                <td className="text-xs">{new Date(trace.latest).toLocaleString()}</td>
                <td>
                  <button className="text-accent-primary text-xs font-semibold hover:underline">View Timeline</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
