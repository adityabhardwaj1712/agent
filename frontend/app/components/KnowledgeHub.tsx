'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Search, Database, Trash2, CheckCircle, Clock } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface DocFile {
  file_id: string;
  filename: string;
  status: 'ingested' | 'pending' | 'failed';
  uploaded_at: string;
}

export default function KnowledgeHub() {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
          'Authorization': `Bearer ${localStorage.getItem('agentcloud_token')}`
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
    <div className="flex flex-col gap-6 animate-ms-fade-in">
      {/* Search and Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="text" 
            placeholder="Search knowledge base..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-[13px] text-white focus:outline-none focus:border-[#2e6fff]/50 transition-all"
          />
        </div>
        <label className={`cursor-pointer flex items-center gap-2 bg-[#2e6fff] hover:bg-[#2e6fff]/90 text-white px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload size={16} />
          {isUploading ? 'INGESTING...' : 'INGEST_DOCUMENT'}
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.csv,.txt,.docx" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-2 ms-glass-panel overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <FileText size={18} className="text-[#2e6fff]" />
            <span className="text-[13px] font-bold uppercase tracking-wider">PROCESSED_KNOWLEDGE</span>
            <span className="ml-auto text-[10px] font-mono text-white/40">{files.length} ITEMS</span>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            {files.length === 0 ? (
               <div className="p-12 text-center text-white/30 flex flex-col items-center gap-3">
                  <Database size={48} className="opacity-20" />
                  <div className="text-[12px]">Neural memory is empty. Ingest documents to provide agent context.</div>
               </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-[#06090f]/80 backdrop-blur-md">
                  <tr className="border-b border-white/5 text-[10px] uppercase font-mono text-white/30">
                    <th className="p-4 text-left">Filename</th>
                    <th className="p-4 text-left">Neural_Status</th>
                    <th className="p-4 text-right">Timestamp</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.file_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all group">
                      <td className="p-4 flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/40">
                            <FileText size={16} />
                         </div>
                         <span className="text-[13px] text-white/80 font-medium">{f.filename}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {f.status === 'ingested' ? (
                            <><CheckCircle size={14} className="text-emerald-400" /> <span className="text-[11px] text-emerald-400 font-mono">READY</span></>
                          ) : (
                            <><Clock size={14} className="text-yellow-400" /> <span className="text-[11px] text-yellow-400 font-mono">PROCESSING</span></>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right text-[11px] font-mono text-white/40">{new Date(f.uploaded_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button className="text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
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
           <div className="ms-glass-panel p-5 flex flex-col gap-4">
              <div className="text-[12px] font-bold text-white/60">MEMORY_UTILIZATION</div>
              <div className="flex items-end justify-between">
                 <div className="text-3xl font-bold font-mono text-[#2e6fff]">42.8<span className="text-sm opacity-50 ml-1">GB</span></div>
                 <div className="text-[10px] text-emerald-400 font-mono">+2.4% INCREMENTAL</div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-[#2e6fff] w-[42%]" />
              </div>
              <div className="text-[10px] text-white/30 flex justify-between uppercase">
                 <span>Sector 01: Vector</span>
                 <span>42.2% Capacity</span>
              </div>
           </div>

           <div className="ms-glass-panel p-5 bg-[#2e6fff]/5 border-[#2e6fff]/20">
              <div className="flex items-center gap-3 mb-3">
                 <Database size={20} className="text-[#2e6fff]" />
                 <div className="text-[13px] font-bold">RAG_ORCHESTRATOR</div>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed mb-4">
                 Our neural RAG system chunks and embeds documents into a high-dimensional vector space. Agents automatically query this knowledge base during mission execution.
              </p>
              <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between p-2 rounded bg-black/20 text-[10px]">
                    <span className="text-white/40">Chunk_Size:</span>
                    <span className="font-mono text-white">512 tokens</span>
                 </div>
                 <div className="flex items-center justify-between p-2 rounded bg-black/20 text-[10px]">
                    <span className="text-white/40">Overlap:</span>
                    <span className="font-mono text-white">50 tokens</span>
                 </div>
                 <div className="flex items-center justify-between p-2 rounded bg-black/20 text-[10px]">
                    <span className="text-white/40">Embedding_Model:</span>
                    <span className="font-mono text-white uppercase">text-embedding-3-small</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
