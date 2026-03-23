"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiJson } from "../lib/api";
import {
  Plus, Trash2, RefreshCw, Bot, Shield, Zap, Brain, Search,
  Copy, Check, ChevronRight, Star, TrendingUp, Activity,
  Settings, Code2, Globe, BarChart2, FileText, Users
} from "lucide-react";

type Agent = {
  agent_id: string;
  name: string;
  role?: string;
  description?: string;
  owner_id: string;
  scopes: string[];
  reputation_score: number;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  token?: string | null;
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  "Research Analyst": <Globe size={16} />,
  "Software Engineer": <Code2 size={16} />,
  "Data Scientist": <BarChart2 size={16} />,
  "Content Strategist": <FileText size={16} />,
  "Project Manager": <Users size={16} />,
};

const ROLE_COLORS: Record<string, string> = {
  "Research Analyst": "#3B82F6",
  "Software Engineer": "#8B5CF6",
  "Data Scientist": "#10B981",
  "Content Strategist": "#F59E0B",
  "Project Manager": "#EF4444",
};

function ReputationBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 4, background: "rgba(255,255,255,0.08)",
        borderRadius: 4, overflow: "hidden"
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: color,
          borderRadius: 4, transition: "width 0.6s ease",
          boxShadow: `0 0 8px ${color}60`
        }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 32 }}>{pct.toFixed(0)}</span>
    </div>
  );
}

function AgentCard({
  agent, onDelete, onCopyToken
}: {
  agent: Agent;
  onDelete: (id: string) => void;
  onCopyToken: (token: string) => void;
}) {
  const roleColor = ROLE_COLORS[agent.role || ""] || "#3B82F6";
  const roleIcon = ROLE_ICONS[agent.role || ""] || <Bot size={16} />;
  const successRate = agent.total_tasks > 0
    ? Math.round((agent.successful_tasks / agent.total_tasks) * 100)
    : 0;

  return (
    <div className="ac-agent-card" style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-muted)",
      borderRadius: 16,
      padding: 20,
      transition: "all 0.2s ease",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${roleColor}40`;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${roleColor}15`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-muted)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${roleColor}, transparent)`,
        borderRadius: "16px 16px 0 0"
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `${roleColor}18`,
            border: `1px solid ${roleColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: roleColor
          }}>
            {roleIcon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{agent.name}</div>
            {agent.role && (
              <div style={{ fontSize: 11, color: roleColor, fontWeight: 600, marginTop: 1 }}>{agent.role}</div>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(agent.agent_id)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-tertiary)", padding: 4, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#EF4444"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Description */}
      {agent.description && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>
          {agent.description}
        </p>
      )}

      {/* Reputation */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reputation</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Star size={10} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
          </div>
        </div>
        <ReputationBar score={agent.reputation_score} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Tasks", value: agent.total_tasks, color: "var(--accent-primary)" },
          { label: "Success", value: `${successRate}%`, color: "#10B981" },
          { label: "Failed", value: agent.failed_tasks, color: "#EF4444" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg-tertiary)", borderRadius: 8, padding: "8px 10px",
            textAlign: "center", border: "1px solid var(--border-muted)"
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scopes */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {agent.scopes.slice(0, 3).map(scope => (
          <span key={scope} style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 4,
            background: "rgba(59,130,246,0.1)", color: "var(--accent-primary)",
            border: "1px solid rgba(59,130,246,0.15)", fontWeight: 600
          }}>{scope}</span>
        ))}
        {agent.scopes.length > 3 && (
          <span style={{ fontSize: 10, color: "var(--text-tertiary)", padding: "2px 4px" }}>
            +{agent.scopes.length - 3} more
          </span>
        )}
      </div>

      {/* Agent ID */}
      <div style={{
        background: "var(--bg-tertiary)", borderRadius: 8, padding: "8px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        border: "1px solid var(--border-muted)"
      }}>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "monospace" }}>
          {agent.agent_id.substring(0, 18)}…
        </span>
        {agent.token && (
          <button
            onClick={() => onCopyToken(agent.token!)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "1px solid var(--border-muted)",
              borderRadius: 6, padding: "3px 8px", cursor: "pointer",
              color: "var(--text-secondary)", fontSize: 10, fontWeight: 600,
              transition: "all 0.15s"
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)"; (e.currentTarget as HTMLElement).style.color = "var(--accent-primary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-muted)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            <Copy size={11} /> JWT
          </button>
        )}
        <Link 
          href={`/agents/${agent.agent_id}`}
          style={{
            color: roleColor,
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 4,
            textDecoration: "none",
            padding: "2px 6px",
            borderRadius: 4,
            transition: "all 0.15s"
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${roleColor}15`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          Details <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function RegisterAgentModal({
  onClose, onSuccess
}: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("agentcloud_token") : null;
      const result = await apiJson("/v1/agents/register", {
        method: "POST",
        json: { name: name.trim(), role: role.trim() || undefined, description: description.trim() || undefined, owner_id: "placeholder" },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!result.ok) {
        setError((result.error as any)?.detail || "Registration failed");
      } else {
        onSuccess();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  const PRESET_ROLES = ["Research Analyst", "Software Engineer", "Data Scientist", "Content Strategist", "Project Manager", "Security Auditor", "DevOps Engineer"];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-active)",
        borderRadius: 20, padding: 28, width: "min(520px, 90vw)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Register Agent</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>Create a new autonomous agent</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 20 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Agent Name *</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. my-research-agent"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
                background: "var(--bg-input)", border: "1px solid var(--border-active)",
                color: "var(--text-primary)", outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {PRESET_ROLES.map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                  border: `1px solid ${role === r ? "var(--accent-primary)" : "var(--border-muted)"}`,
                  background: role === r ? "rgba(59,130,246,0.15)" : "var(--bg-tertiary)",
                  color: role === r ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: 600, transition: "all 0.15s"
                }}>{r}</button>
              ))}
            </div>
            <input
              value={role} onChange={e => setRole(e.target.value)}
              placeholder="Or type a custom role..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
                background: "var(--bg-input)", border: "1px solid var(--border-active)",
                color: "var(--text-primary)", outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
                background: "var(--bg-input)", border: "1px solid var(--border-active)",
                color: "var(--text-primary)", outline: "none", resize: "vertical",
                fontFamily: "inherit"
              }}
            />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid var(--border-muted)",
              background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: 14, fontWeight: 600
            }}>Cancel</button>
            <button onClick={handleRegister} disabled={loading} style={{
              flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
              background: loading ? "rgba(59,130,246,0.4)" : "var(--accent-primary)",
              color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700,
              boxShadow: loading ? "none" : "0 4px 14px rgba(59,130,246,0.4)"
            }}>
              {loading ? "Registering..." : "Register Agent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"my" | "all" | "builtin">("my");

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tab === "my" ? "/v1/agents/my" : tab === "builtin" ? "/v1/agents/builtin" : "/v1/agents/";
      const result = await apiJson<Agent[]>(endpoint);
      if (result.ok) setAgents(result.data);
      else setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleDelete = async (agent_id: string) => {
    const result = await apiJson(`/v1/agents/${agent_id}`, { method: "DELETE" });
    if (result.ok) fetchAgents();
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const filtered = agents.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: agents.length,
    avgRep: agents.length ? Math.round(agents.reduce((s, a) => s + a.reputation_score, 0) / agents.length) : 0,
    totalTasks: agents.reduce((s, a) => s + a.total_tasks, 0),
  };

  return (
    <div style={{ maxWidth: 1200, animation: "slideUp 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Agents</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 5 }}>
              Manage your autonomous agents and built-in templates
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 10, border: "none",
              background: "var(--accent-primary)", color: "white",
              cursor: "pointer", fontSize: 14, fontWeight: 700,
              boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
              transition: "all 0.2s"
            }}
          >
            <Plus size={16} /> New Agent
          </button>
        </div>

        {/* Summary stats */}
        <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
          {[
            { label: "Total Agents", value: stats.total, icon: <Bot size={16} />, color: "var(--accent-primary)" },
            { label: "Avg Reputation", value: stats.avgRep, icon: <Star size={16} />, color: "#F59E0B" },
            { label: "Tasks Run", value: stats.totalTasks, icon: <Activity size={16} />, color: "#10B981" },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 16px", borderRadius: 10,
              background: "var(--bg-card)", border: "1px solid var(--border-muted)"
            }}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", padding: 4, borderRadius: 10, border: "1px solid var(--border-muted)" }}>
          {(["my", "all", "builtin"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all 0.2s",
              background: tab === t ? "var(--accent-primary)" : "transparent",
              color: tab === t ? "white" : "var(--text-secondary)",
              boxShadow: tab === t ? "0 2px 8px rgba(59,130,246,0.3)" : "none"
            }}>
              {t === "my" ? "My Agents" : t === "all" ? "All Agents" : "Built-in"}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            style={{
              paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
              borderRadius: 9, border: "1px solid var(--border-muted)",
              background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13,
              outline: "none", width: 220
            }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 280, borderRadius: 16, background: "var(--bg-card)",
              border: "1px solid var(--border-muted)", animation: "pulse 1.5s ease-in-out infinite"
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px 20px",
          background: "var(--bg-card)", borderRadius: 16,
          border: "1px dashed var(--border-active)"
        }}>
          <Bot size={48} style={{ color: "var(--text-tertiary)", margin: "0 auto 16px" }} />
          <h3 style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
            {tab === "my" ? "No agents yet" : "No agents found"}
          </h3>
          <p style={{ color: "var(--text-tertiary)", fontSize: 14, marginBottom: 20 }}>
            {tab === "my" ? "Register your first agent to get started" : "Try adjusting your search"}
          </p>
          {tab === "my" && (
            <button onClick={() => setShowModal(true)} style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "var(--accent-primary)", color: "white",
              cursor: "pointer", fontSize: 14, fontWeight: 600
            }}>
              Register First Agent
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(agent => (
            <AgentCard
              key={agent.agent_id}
              agent={agent}
              onDelete={handleDelete}
              onCopyToken={handleCopyToken}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {copied && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: "var(--accent-success)", color: "white",
          padding: "12px 20px", borderRadius: 10, display: "flex",
          alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 999,
          animation: "slideUp 0.3s ease-out"
        }}>
          <Check size={16} /> JWT Token Copied!
        </div>
      )}

      {showModal && (
        <RegisterAgentModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchAgents}
        />
      )}
    </div>
  );
}
