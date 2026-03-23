'use client';

import { useEffect, useState, useMemo } from "react";
import { apiJson } from "../lib/api";
import { 
  Shield, 
  Search, 
  Filter, 
  Clock, 
  Activity,
  ChevronRight,
  RefreshCw,
  FileText,
  BadgeCheck,
  Zap,
  Cpu,
  Loader2,
  Database,
  History
} from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    const res = await apiJson<AuditLog[]>("/audit/logs");
    if (res.ok) {
      setLogs(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !search || 
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.path.toLowerCase().includes(search.toLowerCase()) ||
        (log.agent_id || "").toLowerCase().includes(search.toLowerCase());
      const matchesMethod = methodFilter === "ALL" || log.method === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [logs, search, methodFilter]);

  const getMethodStyle = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'POST': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'PUT': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'DELETE': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-tertiary bg-tertiary/10 border-tertiary/20';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto animate-slide-in p-4 md:p-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-500">
            <History size={18} />
            <span className="text-[10px] font-black tracking-widest uppercase">Security Archive Layer-X // Log_Registry</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">Deterministic Audit</h1>
          <p className="text-secondary text-sm max-w-xl mt-3 leading-relaxed">
             Complete immutable trace history of the neural fabric. Monitoring all agent transitions and system manipulations.
          </p>
        </div>
        
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="px-6 py-3 glass-card rounded-2xl border border-white/10 shadow-lg hover:border-indigo-500/30 transition-all flex items-center gap-3 text-secondary hover:text-primary disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-indigo-500" : "text-indigo-500"} />
          <span className="text-[10px] font-black uppercase tracking-widest">Resync_Archive</span>
        </button>
      </header>

      {/* Control Surface */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="FILTER_BY_HASH_PATH_OR_ORIGIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-tertiary/5 border border-white/5 rounded-2xl text-[11px] font-mono text-primary placeholder:text-tertiary/40 outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all shadow-inner uppercase"
          />
        </div>
        
        <div className="flex items-center gap-4 bg-tertiary/5 border border-white/5 rounded-2xl px-6 py-4">
           <Filter size={16} className="text-tertiary" />
           <select 
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-transparent text-[11px] font-black text-secondary outline-none cursor-pointer uppercase tracking-widest"
           >
             <option value="ALL">ALL_METHODS</option>
             <option value="GET">GET_TRACE</option>
             <option value="POST">POST_COMMIT</option>
             <option value="PUT">PUT_REPLACE</option>
             <option value="DELETE">DELETE_TRUNCATE</option>
           </select>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
              <Database size={48} className="text-indigo-500/20" />
              <Loader2 size={48} className="absolute inset-0 text-indigo-500 animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-tertiary">Decrypting Event Buffer...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-60">
            <div className="w-20 h-20 bg-tertiary/10 rounded-full flex items-center justify-center">
              <FileText size={40} className="text-tertiary" />
            </div>
            <div className="text-center">
               <h3 className="text-xl font-black text-primary uppercase tracking-tight">Zero Entropy State</h3>
               <p className="text-[10px] font-bold text-tertiary uppercase mt-1 tracking-widest">No matching traces found in the current temporal window</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tertiary/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-tertiary uppercase tracking-widest">Operation_Action</th>
                  <th className="px-8 py-5 text-[10px] font-black text-tertiary uppercase tracking-widest">HTTP_Context</th>
                  <th className="px-8 py-5 text-[10px] font-black text-tertiary uppercase tracking-widest">Exit_Code</th>
                  <th className="px-8 py-5 text-[10px] font-black text-tertiary uppercase tracking-widest">Agent_Origin</th>
                  <th className="px-8 py-5 text-[10px] font-black text-tertiary uppercase tracking-widest">Timestamp_UTC</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => {
                  const methodClass = getMethodStyle(log.method);
                  return (
                    <tr key={log.log_id} className="group hover:bg-indigo-500/5 transition-colors cursor-pointer">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-indigo-500/30 group-hover:bg-indigo-500 transition-colors" />
                           <div>
                              <div className="text-[12px] font-black text-primary uppercase tracking-tight group-hover:text-indigo-500 transition-colors">{log.action}</div>
                              <div className="text-[9px] font-mono text-tertiary mt-1 opacity-60 font-bold uppercase tracking-widest">ID: {log.log_id.split('-')[0]}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${methodClass} transition-all`}>
                            {log.method}
                          </span>
                          <span className="text-[11px] font-mono text-secondary group-hover:text-primary transition-colors tracking-tighter opacity-80">{log.path}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {log.status_code ? (
                          <div className={`flex items-center gap-2 text-[12px] font-black ${parseInt(log.status_code) < 400 ? 'text-green-500' : 'text-red-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${parseInt(log.status_code) < 400 ? 'bg-green-500' : 'bg-red-500'}`} />
                            {log.status_code}
                          </div>
                        ) : (
                          <span className="text-tertiary opacity-30">—</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          {log.agent_id ? (
                            <>
                              <div className="p-1.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                <Cpu size={14} className="text-indigo-500" />
                              </div>
                              <div>
                                <div className="text-[11px] font-black text-secondary tracking-tighter uppercase leading-none">Agent_Node</div>
                                <div className="text-[9px] font-bold text-tertiary mt-1">ID: {log.agent_id.substring(0, 8)}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-1.5 bg-tertiary/10 rounded-lg group-hover:bg-tertiary/20 transition-colors">
                                <Shield size={14} className="text-tertiary" />
                              </div>
                              <div className="text-[11px] font-black text-tertiary tracking-tighter uppercase">System_Core</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-tertiary tracking-tighter">
                          <Clock size={12} className="opacity-40" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2 text-tertiary hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Visual background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5 z-[-1]">
         <div className="absolute top-[10%] right-[5%] w-[40rem] h-[40rem] bg-indigo-500 rounded-full filter blur-[100px] animate-pulse" />
         <div className="absolute bottom-[20%] left-[10%] w-[30rem] h-[30rem] bg-indigo-600 rounded-full filter blur-[120px]" />
      </div>
    </div>
  );
}
  );
}
