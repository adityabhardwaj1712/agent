"use client";
import React from "react";

interface ProtocolGraphProps {
  events: any[];
}

export default function ProtocolGraph({ events }: ProtocolGraphProps) {
  // Build node data from events or use fallback
  const agents: { id: string; label: string }[] = [];
  const tasks: { id: string; label: string }[] = [];
  const seenAgents = new Set<string>();
  const seenTasks = new Set<string>();

  const eventsSlice = events.slice(0, 6);

  if (eventsSlice.length > 0) {
    eventsSlice.forEach((event) => {
      const agentId = event.agent_id || "System";
      const taskId = event.task_id || "Global";
      if (!seenAgents.has(agentId)) {
        agents.push({ id: agentId, label: `Agent: ${agentId.slice(0, 10)}` });
        seenAgents.add(agentId);
      }
      if (!seenTasks.has(taskId)) {
        tasks.push({ id: taskId, label: event.step || event.event_type || "Process" });
        seenTasks.add(taskId);
      }
    });
  } else {
    agents.push({ id: "claude", label: "Agent: Claude-3.5" });
    agents.push({ id: "gpt4o", label: "Agent: GPT-4o" });
    tasks.push({ id: "t1", label: "Task: Analyze Document" });
  }

  return (
    <div style={{
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: "24px 32px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(30,41,59,0.4) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Agent Nodes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 1 }}>
        {agents.map((agent) => (
          <div key={agent.id} style={{
            background: "#171A21",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "12px 20px",
            color: "#F0F2F5",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 160,
          }}>
            <span style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}>AI</span>
            [{agent.label}]
          </div>
        ))}
      </div>

      {/* Connection Lines */}
      <svg width="80" height="120" style={{ zIndex: 1, overflow: "visible" }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        {agents.map((_, i) => (
          <g key={i}>
            <line
              x1="0"
              y1={30 + i * 52}
              x2="80"
              y2={60}
              stroke="url(#lineGrad)"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.6"
            />
            <circle cx="80" cy="60" r="3" fill="#38BDF8" opacity="0.8">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>

      {/* Task Nodes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 1 }}>
        {tasks.map((task) => (
          <div key={task.id} style={{
            background: "#0F172A",
            border: "1px solid rgba(56,189,248,0.25)",
            borderRadius: 10,
            padding: "12px 20px",
            color: "#38BDF8",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 180,
          }}>
            <span style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "rgba(56,189,248,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}>📋</span>
            [{task.label}]
          </div>
        ))}
      </div>

      {/* Right connection */}
      <svg width="80" height="120" style={{ zIndex: 1, overflow: "visible" }}>
        {tasks.map((_, i) => (
          <g key={i}>
            <line
              x1="0"
              y1={30 + i * 52}
              x2="80"
              y2={60}
              stroke="url(#lineGrad)"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.6"
            />
            <circle cx="80" cy="60" r="3" fill="#38BDF8" opacity="0.8">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>
        ))}
      </svg>

      {/* Output Agents */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 1 }}>
        {agents.slice(0, 2).map((agent, i) => (
          <div key={`out-${agent.id}`} style={{
            background: "#171A21",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "12px 20px",
            color: "#F0F2F5",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 160,
          }}>
            <span style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: i === 0 ? "linear-gradient(135deg, #10B981, #22C55E)" : "linear-gradient(135deg, #F59E0B, #EF4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}>AI</span>
            [{agent.label}]
          </div>
        ))}
      </div>
    </div>
  );
}
