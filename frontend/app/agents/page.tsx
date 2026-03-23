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
  const color = pct >= 80 ? "var(--accent-success)" : pct >= 50 ? "var(--accent-warning)" : "var(--accent-danger)";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-tertiary rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
        <div 
          className="h-full transition-all duration-700 ease-out"
          style={{ 
            width: `${pct}%`, 
            background: color,
            boxShadow: `0 0 12px ${color}40`
          }} 
        />
      </div>
      <span className="text-[10px] font-bold tracking-tight" style={{ color }}>{pct.toFixed(0)}</span>
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
  const roleColor = ROLE_COLORS[agent.role || ""] || "var(--accent-primary)";
  const roleIcon = ROLE_ICONS[agent.role || ""] || <Bot size={18} />;
  const successRate = agent.total_tasks > 0
    ? Math.round((agent.successful_tasks / agent.total_tasks) * 100)
    : 0;

  return (
    <div className="glass-card p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 opacity-50 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, ${roleColor}, transparent)` }} />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${roleColor}15`, color: roleColor }}>
            {roleIcon}
          </div>
          <div>
            <h3 className="font-bold text-sm text-primary leading-tight" style={{ color: 'var(--text-primary)' }}>{agent.name}</h3>
            {agent.role && (
              <span className="text-[10px] font-bold uppercase tracking-wider block mt-0.5 opacity-80" style={{ color: roleColor }}>{agent.role}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(agent.agent_id)}
          className="p-1.5 rounded-lg text-tertiary hover:bg-red-500/10 hover:text-red-500 transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Description */}
      {agent.description && (
        <p className="text-xs text-secondary leading-relaxed mb-4 line-clamp-2 h-8" style={{ color: 'var(--text-secondary)' }}>
          {agent.description}
        </p>
      )}

      {/* Reputation */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] uppercase font-bold text-tertiary tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Reputation</span>
          <Star size={10} className="text-yellow-500 fill-yellow-500" />
        </div>
        <ReputationBar score={agent.reputation_score} />
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Tasks", value: agent.total_tasks, color: "var(--accent-primary)" },
          { label: "Succ.", value: `${successRate}%`, color: "var(--accent-success)" },
          { label: "Fail", value: agent.failed_tasks, color: "var(--accent-danger)" },
        ].map(s => (
          <div key={s.label} className="bg-tertiary/40 rounded-lg p-2 text-center border border-color transition-colors group-hover:bg-tertiary/60" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--card-border)' }}>
            <div className="text-xs font-bold leading-none mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] uppercase font-bold text-tertiary tracking-tighter" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-color" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-center gap-2">
           {agent.token && (
            <button
              onClick={() => onCopyToken(agent.token!)}
              className="px-2 py-1 rounded-md border border-color text-[9px] font-bold text-secondary hover:bg-tertiary transition-colors flex items-center gap-1"
              style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
            >
              <Copy size={10} /> JWT
            </button>
          )}
        </div>
        <Link 
          href={`/agents/${agent.agent_id}`}
          className="text-[10px] font-bold flex items-center gap-1 hover:gap-1.5 transition-all text-secondary group-hover:text-primary"
          style={{ color: 'var(--text-secondary)' }}
        >
          VIEW DETAILS <ChevronRight size={10} />
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
      const result = await apiJson("/agents/register", {
        method: "POST",
        json: { 
          name: name.trim(), 
          role: role.trim() || "Generalist Agent", 
          description: description.trim() || undefined, 
          owner_id: "agentcloud-user" 
        },
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card w-full max-w-lg p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-active)' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary tracking-tight" style={{ color: 'var(--text-primary)' }}>Register Agent</h2>
            <p className="text-secondary text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Deploy a new autonomous intelligence unit</p>
          </div>
          <button onClick={onClose} className="text-tertiary hover:text-primary transition-colors text-2xl" style={{ color: 'var(--text-tertiary)' }}>&times;</button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-tertiary tracking-widest block px-1" style={{ color: 'var(--text-secondary)' }}>Agent Name *</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. neuro-analyst-01"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 bg-tertiary border border-color outline-none"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-tertiary tracking-widest block px-1" style={{ color: 'var(--text-secondary)' }}>Specialized Role</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ROLES.map(r => (
                <button key={r} onClick={() => setRole(r)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${role === r ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : 'border-color text-tertiary bg-tertiary'}`}
                  style={{ 
                    borderColor: role === r ? 'var(--accent-primary)' : 'var(--card-border)',
                    background: role === r ? 'var(--accent-blue-soft)' : 'var(--bg-tertiary)',
                    color: role === r ? 'var(--accent-primary)' : 'var(--text-tertiary)'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              value={role} onChange={e => setRole(e.target.value)}
              placeholder="Or define a custom role..."
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 bg-tertiary border border-color outline-none"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-tertiary tracking-widest block px-1" style={{ color: 'var(--text-secondary)' }}>Mission Directive</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the agent's primary focus and constraints..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 bg-tertiary border border-color outline-none resize-none"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold animate-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-secondary border border-color hover:bg-tertiary transition-all" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
              Abort
            </button>
            <button onClick={handleRegister} disabled={loading} className="flex-[2] py-3 rounded-xl text-sm font-bold text-white gradient-bg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2">
              {loading && <RefreshCw size={14} className="animate-spin" />}
              {loading ? "INITIALIZING..." : "DEPLOY AGENT"}
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
      const endpoint = tab === "my" ? "/agents/my" : tab === "builtin" ? "/agents/builtin" : "/agents/";
      const result = await apiJson<Agent[]>(endpoint);
      if (result.ok) setAgents(result.data);
      else setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleDelete = async (agent_id: string) => {
    const result = await apiJson(`/agents/${agent_id}`, { method: "DELETE" });
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
    <div className="max-w-[1400px] animate-slide-in">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tighter mb-2" style={{ color: 'var(--text-primary)' }}>
            Agents <span className="text-indigo-500/50 text-2xl font-light ml-2">CORE</span>
          </h1>
          <p className="text-secondary text-sm max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Orchestrate your fleet of autonomous intelligence units. Monitor performance, reputation, and task execution across the AXON network.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white gradient-bg shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={18} /> INITIALIZE AGENT
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Active Nodes", value: stats.total, icon: <Bot size={20} />, color: "var(--accent-primary)" },
          { label: "Avg Reputation", value: `${stats.avgRep}%`, icon: <Star size={20} />, color: "#F59E0B" },
          { label: "Neural Tasks", value: stats.totalTasks.toLocaleString(), icon: <Activity size={20} />, color: "#10B981" },
        ].map(s => (
          <div key={s.label} className="glass-card p-6 rounded-2xl stat-card group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-black text-primary leading-tight" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-tertiary mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex p-1 bg-tertiary/20 rounded-xl border border-color" style={{ background: 'var(--bg-card)', borderColor: 'var(--card-border)' }}>
          {(["my", "all", "builtin"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? 'gradient-bg text-white shadow-md' : 'text-tertiary hover:text-secondary'}`}
              style={{ color: tab === t ? 'white' : 'var(--text-tertiary)' }}
            >
              {t === "my" ? "Personal" : t === "all" ? "Network" : "Templates"}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search neural signatures..."
            className="w-full sm:w-[300px] pl-10 pr-4 py-2.5 rounded-xl text-sm bg-tertiary border border-color outline-none transition-all focus:ring-2 focus:ring-indigo-500/10"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--card-border)' }}
          />
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[280px] rounded-2xl bg-tertiary border border-color animate-pulse" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--card-border)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card py-20 rounded-3xl border-dashed border-2 flex flex-col items-center justify-center text-center px-6" style={{ borderColor: 'var(--border-active)' }}>
          <div className="w-20 h-20 rounded-full bg-tertiary flex items-center justify-center mb-6" style={{ background: 'var(--bg-tertiary)' }}>
            <Bot size={40} className="text-tertiary opacity-30" />
          </div>
          <h3 className="text-xl font-bold text-secondary mb-2" style={{ color: 'var(--text-secondary)' }}>
            {tab === "my" ? "Command Center Empty" : "No Neural Matches"}
          </h3>
          <p className="text-tertiary text-sm max-w-xs mb-8" style={{ color: 'var(--text-tertiary)' }}>
            {tab === "my" ? "You haven't deployed any personal agents yet. Initialize your first node to begin." : "Try refining your search parameters."}
          </p>
          {tab === "my" && (
            <button onClick={() => setShowModal(true)} className="px-8 py-3 rounded-xl font-bold text-sm text-white gradient-bg shadow-xl">
              INITIALIZE FIRST AGENT
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
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

      {/* Toast Notification */}
      {copied && (
        <div className="fixed bottom-10 right-10 gradient-bg text-white px-6 py-4 rounded-2xl flex items-center gap-3 font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-5 duration-300 z-50">
          <Check size={18} /> Neural Hash Copied to Clipboard
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
