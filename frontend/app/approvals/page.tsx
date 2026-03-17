"use client";

import React, { useEffect, useState } from "react";
import { apiJson } from "../lib/api";
import { CheckCircle, XCircle, Clock, ShieldAlert } from "lucide-react";

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
    const res = await apiJson<ApprovalRequest[]>("/v1/approvals/");
    if (res.ok) {
      setApprovals(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function handleAction(request_id: string, action: "approve" | "reject") {
    // For now, hardcoding a user_id for the action
    const res = await apiJson(`/v1/approvals/${request_id}/action`, {
      method: "POST",
      json: { action, user_id: "admin-1" },
    });

    if (res.ok) {
      setApprovals((prev) => prev.filter((a) => a.request_id !== request_id));
    } else {
      alert("Failed to process approval action.");
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-accent-primary" />
          HITL Governance Dashboard
        </h1>
        <p className="text-secondary mt-1">Review and authorize critical agent operations.</p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="ac-card flex flex-col items-center justify-center p-20 text-center">
          <CheckCircle className="text-green-500 w-12 h-12 mb-4 opacity-20" />
          <h2 className="text-xl font-medium text-white">All Clear</h2>
          <p className="text-secondary">There are no pending approval requests at this time.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {approvals.map((req) => (
            <div key={req.request_id} className="ac-card border-l-4 border-l-accent-primary overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {req.operation.replace("_", " ")}
                    </span>
                    <span className="text-xs text-secondary flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Request from Agent: <span className="text-accent-primary">{req.agent_id}</span>
                  </h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm text-slate-300 border border-white/5 max-h-40 overflow-auto">
                    {req.payload}
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 justify-center">
                  <button
                    onClick={() => handleAction(req.request_id, "approve")}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl font-semibold transition-all shadow-lg shadow-accent-primary/20"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(req.request_id, "reject")}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all border border-white/10"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              </div>
              
              {req.goal_id && (
                <div className="px-5 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-secondary">
                    Associated Goal: <span className="text-white ml-1">{req.goal_id}</span>
                  </span>
                  <button className="text-[10px] text-accent-primary hover:underline font-bold uppercase tracking-widest">
                    View Goal Context
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
