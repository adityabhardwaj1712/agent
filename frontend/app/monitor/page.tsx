"use client";
import React, { useEffect, useState } from "react";

interface Metric {
  active_agents: number;
  tasks_last_24h: number;
  success_rate: string;
  auto_healing_events: number;
  events_summary: Record<string, number>;
}

export default function ExecutionMonitor() {
  const [metrics, setMetrics] = useState<Metric | null>(null);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchMetrics = () => {
      fetch(`${base}/v1/analytics/metrics`)
        .then(res => res.json())
        .then(data => setMetrics(data));
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div className="animate-pulse text-tertiary">Connecting to fleet...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Execution Monitor</h1>
        <p className="text-secondary">Real-time pulse of the autonomous engine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="ac-card">
          <div className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-4">Throughput</div>
          <div className="text-4xl font-mono font-bold">{metrics.tasks_last_24h}</div>
          <div className="text-xs text-secondary mt-2">Tasks / 24h</div>
        </div>
        <div className="ac-card">
          <div className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-4">Reliability</div>
          <div className="text-4xl font-mono font-bold text-accent-success">{metrics.success_rate}</div>
          <div className="text-xs text-secondary mt-2">Success Rate</div>
        </div>
        <div className="ac-card">
          <div className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-4">Self-Healing</div>
          <div className="text-4xl font-mono font-bold text-accent-warning">{metrics.auto_healing_events}</div>
          <div className="text-xs text-secondary mt-2">Interventions</div>
        </div>
      </div>

      <div className="ac-card">
        <h3 className="text-sm font-semibold mb-6 uppercase tracking-wider opacity-60">Event Distribution</h3>
        <div className="space-y-4">
          {Object.entries(metrics.events_summary || {}).map(([type, count]) => (
            <div key={type} className="group">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary font-medium">{type}</span>
                <span className="text-tertiary font-mono">{count}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-primary transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (count / metrics.tasks_last_24h) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
