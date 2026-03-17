"use client";
import React, { useEffect, useState } from "react";

interface Agent {
  agent_id: string;
  name: string;
  reputation_score: number;
  total_tasks: number;
}

export default function Leaderboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${base}/v1/agents/leaderboard`)
      .then(res => res.json())
      .then(data => setAgents(data));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2">Agent Leaderboard</h1>
      <p className="text-secondary mb-8">The most reliable and high-performing autonomous units.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent, index) => (
          <div key={agent.agent_id} className="ac-card flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className="text-4xl font-bold opacity-10 group-hover:opacity-30 transition-opacity">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <div className="font-semibold text-lg">{agent.name}</div>
                <div className="text-xs text-tertiary">ID: {agent.agent_id}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent-success">{agent.reputation_score.toFixed(1)}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-tertiary">{agent.total_tasks} Tasks</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
