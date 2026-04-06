'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Search, Database, Trash2, CheckCircle, Clock } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface DocFile {
  file_id: string;
  filename: string;
  status: 'ingested' | 'pending' | 'failed';
  uploaded_at: string;
  chunks?: number;
  size_chars?: number;
}

export default function KnowledgeHub() {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState<DocFile | null>(null);

  const fetchFiles = async () => {
    try {
      const data = await apiFetch<any>('/files');
      if (data?.files) setFiles(data.files);
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agentcloud_token') || ''}`
        },
        body: formData
      });

      if (resp.ok) {
        await fetchFiles();
      }
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-ms-fade-in relative h-full">
      {/* Search and Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="text" 
            placeholder="Search knowledge base..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-[13px] text-white focus:outline-none focus:border-[#2e6fff]/50 transition-all font-mono"
          />
        </div>
        <label className={`cursor-pointer flex items-center gap-2 bg-[#2e6fff] hover:bg-[#2e6fff]/90 text-white px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload size={16} />
          {isUploading ? 'INGESTING...' : 'INGEST_DOCUMENT'}
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.csv,.txt,.docx" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Document List */}
        <div className="lg:col-span-2 ms-glass-panel overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#2e6fff]">PROCESSED_KNOWLEDGE</span>
            <span className="ml-auto text-[10px] font-mono text-white/40">{files.length} ITEMS DETECTED</span>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {files.length === 0 ? (
               <div className="p-12 text-center text-white/30 flex flex-col items-center gap-3">
                  <Database size={48} className="opacity-10 mb-4" />
                  <div className="text-[12px] max-w-[200px] font-medium">Neural memory is empty. Ingest documents to provide mission context.</div>
               </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-[#06090f]/80 backdrop-blur-md z-10">
                  <tr className="border-b border-white/5 text-[9px] uppercase font-mono text-white/30">
                    <th className="p-4 text-left">Document_Node</th>
                    <th className="p-4 text-left">Neural_Sync</th>
                    <th className="p-4 text-right">Metrics</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.file_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all group">
                      <td className="p-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#2e6fff]/10 flex items-center justify-center text-[#2e6fff] border border-[#2e6fff]/20">
                               <FileText size={14} />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[13px] text-white/90 font-bold">{f.filename}</span>
                               <span className="text-[9px] font-mono text-white/30 uppercase">{f.file_id.slice(0, 8)}</span>
                            </div>
                         </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${f.status === 'ingested' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-yellow-400 animate-pulse'}`}></div>
                          <span className={`text-[10px] font-mono font-bold ${f.status === 'ingested' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {f.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-mono text-white/60">{f.chunks || 0} CHUNKS</span>
                           <span className="text-[9px] font-mono text-white/30">{( (f.size_chars || 0) / 1024).toFixed(1)} KB</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => setShowPreview(f)}
                            className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white px-3 py-1 rounded border border-white/10 text-[9px] font-mono uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all"
                           >
                             PREVIEW
                           </button>
                           <button className="text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                             <Trash2 size={14} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Knowledge Stats / Insights */}
        <div className="flex flex-col gap-6">
           <div className="ms-glass-panel p-5 flex flex-col gap-4 border-l-2 border-l-[#2e6fff]">
              <div className="text-[10px] font-black text-white/40 tracking-[2px] uppercase">RAG_UTILIZATION_METRICS</div>
              <div className="flex items-end justify-between">
                 <div className="text-3xl font-black font-mono text-white">42.8<span className="text-xs opacity-30 ml-1">GB</span></div>
                 <div className="flex flex-col text-right">
                    <div className="text-[10px] text-emerald-400 font-bold">+2.4% INCREMENTAL</div>
                    <div className="text-[9px] text-white/20 font-mono tracking-tighter">VOL: 1.2M VECTORS</div>
                 </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                 <div className="h-full bg-[#2e6fff] w-[42%] shadow-[0_0_10px_#2e6fff]" />
                 <div className="h-full bg-violet-500/50 w-[15%]" />
              </div>
              <div className="text-[9px] text-white/20 flex justify-between font-mono uppercase tracking-widest">
                 <span>Sector 01: Vector</span>
                 <span>42.2% Capacity</span>
              </div>
           </div>

           <div className="ms-glass-panel flex-1 bg-gradient-to-br from-[#2e6fff]/10 to-transparent border-[#2e6fff]/30 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                 <div className="ms-icon-box bg-[#2e6fff]/20 w-8 h-8 rounded-lg">
                    <Database size={16} className="text-[#2e6fff]" />
                 </div>
                 <div className="flex flex-col">
                    <div className="text-[12px] font-black">NEURAL_ORCHESTRATOR</div>
                    <div className="text-[8px] font-mono text-[#2e6fff] animate-pulse">SYSTEM_UPLINK_READY</div>
                 </div>
              </div>
              <div className="p-5 flex-1 space-y-5">
                 <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                    The AXON RAG engine optimizes document retrieval through specialized recursive character chunking and semantic overlap analysis.
                 </p>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                       <span className="text-[8px] text-white/30 uppercase font-bold tracking-tighter">Chunk_Density</span>
                       <span className="text-[12px] font-mono font-bold">1024_CHARS</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                       <span className="text-[8px] text-white/30 uppercase font-bold tracking-tighter">Overlap_Ratio</span>
                       <span className="text-[12px] font-mono font-bold">10%_CONTEXT</span>
                    </div>
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-[9px] font-bold text-white/40 uppercase mb-3 tracking-widest">Advanced Configurations</div>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between text-[10px]">
                          <span className="text-white/40">Embedding_Model</span>
                          <span className="text-[#2e6fff] font-mono">T-EMBED-3</span>
                       </div>
                       <div className="flex items-center justify-between text-[10px]">
                          <span className="text-white/40">Vector_Store</span>
                          <span className="text-[#2e6fff] font-mono">PG_VECTOR</span>
                       </div>
                       <div className="flex items-center justify-between text-[10px]">
                          <span className="text-white/40">Search_Mode</span>
                          <span className="text-emerald-400 font-mono">HYBRID_SEMANTIC</span>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-white/5 border-t border-white/5">
                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black tracking-widest transition-all">
                    OPTIMIZE_INDEXES
                  </button>
              </div>
           </div>
        </div>
      </div>

      {/* Source Preview Modal Overlay */}
      {showPreview && (
         <div className="absolute inset-0 z-50 bg-[#06090f]/90 backdrop-blur-xl flex items-center justify-center p-20 animate-ms-fade-in">
            <div className="w-full max-w-4xl h-full ms-glass-panel border-[#2e6fff]/30 flex flex-col">
               <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                     <FileText size={24} className="text-[#2e6fff]" />
                     <div>
                        <div className="text-lg font-black">{showPreview.filename}</div>
                        <div className="text-[10px] font-mono text-[var(--t3)] uppercase tracking-widest">Document Source Explorer</div>
                     </div>
                  </div>
                  <button 
                     onClick={() => setShowPreview(null)}
                     className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                  >
                     <span className="text-2xl font-light opacity-50">&times;</span>
                  </button>
               </div>
               <div className="flex-1 p-8 overflow-y-auto font-mono text-[13px] leading-relaxed text-white/70 custom-scrollbar bg-black/20">
                  <div className="mb-8 p-4 bg-[#2e6fff]/5 border-l-2 border-[#2e6fff] rounded-r-lg">
                     <div className="text-[10px] font-bold text-[#2e6fff] uppercase mb-1">Neural Meta-Data</div>
                     <div className="grid grid-cols-3 gap-4 text-[11px]">
                        <div>ID: <span className="text-white">{showPreview.file_id}</span></div>
                        <div>CHUNKS: <span className="text-white">{showPreview.chunks}</span></div>
                        <div>SIZE: <span className="text-white">{showPreview.size_chars} chars</span></div>
                     </div>
                  </div>
                  <div className="opacity-50 select-none pointer-events-none italic mb-4">-- START OF DOCUMENT STREAM --</div>
                  {/* In a real app, this would be the actual text fetched from the backend */}
                  <div className="space-y-4">
                     <p>[REDACTED_TEXT_STREAM] This document has been successfully ingested into the AgentCloud vector cluster. The RAG orchestrator has indexed {showPreview.chunks} unique semantic nodes for agent consultation.</p>
                     <p>Neural search is now active for this document node. Agents assigned to missions within this context will automatically pull relevant chunks to inform their reasoning chains.</p>
                     <div className="p-6 border border-dashed border-white/10 rounded-xl mt-12 bg-white/[0.01]">
                        <p className="text-[11px] text-white/30 text-center uppercase tracking-widest mb-4">Neural Graph Visualization</p>
                        <div className="flex gap-2 justify-center">
                           {[...Array(12)].map((_, i) => (
                              <div key={i} className="w-1 h-8 bg-[#2e6fff]/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 40 + 20}px` }}></div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-6 border-t border-white/10 flex justify-between bg-white/5">
                  <div className="text-[10px] font-mono text-white/30">DECRYPTION_LEVEL: ALPHA-7</div>
                  <button className="ms-btn ms-btn-p py-2 px-6 h-auto text-[11px]" onClick={() => setShowPreview(null)}>CLOSE_VIEWER</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
