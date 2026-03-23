'use client';

import React, { useEffect, useState } from "react";
import { apiJson } from "../lib/api";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  Fingerprint, 
  Zap, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Database,
  Loader2,
  Lock,
  UserCheck
} from "lucide-react";

interface ApprovalRequest {
  request_id: string;
  task_id: string;
  agent_id: string;
  goal_id?: string;
  operation: string;
  payload: string;
  status: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchApprovals() {
    setLoading(true);
    const res = await apiJson<ApprovalRequest[]>("/approvals/");
    if (res.ok) {
      setApprovals(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function handleAction(request_id: string, action: "approve" | "reject") {
    const res = await apiJson(`/approvals/${request_id}/action`, {
      method: "POST",
      json: { action, user_id: "admin-1" },
    });

    if (res.ok) {
      setApprovals((prev) => prev.filter((a) => a.request_id !== request_id));
    } else {
      alert("Transmission failed. Security buffer prevented direct injection.");
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-slide-in p-4 md:p-8">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-2 text-indigo-500">
          <ShieldCheck size={18} />
          <span className="text-[10px] font-black tracking-widest uppercase">Governance Layer-4 // HITL</span>
        </div>
        <h1 className="text-4xl font-black text-primary tracking-tighter">Authorization Registry</h1>
        <p className="text-secondary text-sm max-w-xl mt-3 leading-relaxed">
          High-clearance human-in-the-loop oversight for autonomous agent operations and critical displacement sequences.
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="relative">
            <ShieldAlert size={48} className="text-indigo-500/20" />
            <Loader2 size={48} className="absolute inset-0 text-indigo-500 animate-spin" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-tertiary">Accessing Encrypted Buffer...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="glass-card p-16 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full border border-green-500/20 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-primary uppercase tracking-tight mb-3">Security Perimeter Clear</h2>
          <p className="text-secondary text-sm max-w-sm leading-relaxed opacity-70 font-medium">
            No pending approval requests detected. All neural processes are executing within deterministic safety bounds.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {approvals.map((req) => (
            <div key={req.request_id} className="glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-8 space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                      {req.operation.toUpperCase().replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2 text-tertiary text-[10px] font-bold">
                       <Clock size={12} />
                       REQ_AT: {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-indigo-500">
                       <Fingerprint size={20} />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-primary leading-none uppercase tracking-tight">Agent-{req.agent_id.substring(0, 8)}</h3>
                        <p className="text-[10px] font-bold text-tertiary mt-1">AXON_ID: {req.agent_id}</p>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <Zap size={12} className="text-indigo-500" />
                       <span className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">Proposed Payload</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-6 font-mono text-[11px] text-slate-300 leading-relaxed max-h-[200px] overflow-auto shadow-inner scrollbar-hide italic">
                      {req.payload}
                    </div>
                  </div>

                  {req.goal_id && (
                    <div className="flex items-center gap-3 py-3 px-4 bg-tertiary/5 rounded-xl border border-white/5 w-fit">
                      <Database size={12} className="text-indigo-500" />
                      <span className="text-[10px] font-bold text-tertiary">Context Archive:</span>
                      <span className="text-[10px] font-black text-secondary tracking-tighter">{req.goal_id}</span>
                      <ExternalLink size={10} className="text-indigo-500 cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                  )}
                </div>

                <div className="bg-tertiary/5 lg:w-[260px] p-8 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col justify-center gap-4">
                  <button
                    onClick={() => handleAction(req.request_id, "approve")}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all"
                  >
                    <UserCheck size={16} />
                    Authorize
                  </button>
                  <button
                    onClick={() => handleAction(req.request_id, "reject")}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <XCircle size={16} />
                    Terminate
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-500/5 px-8 py-3 border-t border-white/5 flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em]">Manual override: governance protocol 419-B active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
