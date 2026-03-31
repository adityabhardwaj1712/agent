'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';
import { 
  Play, 
  Settings, 
  Terminal as TerminalIcon, 
  Plus, 
  ChevronRight, 
  Activity, 
  ShieldAlert,
  Zap,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AgentPlayground() {
  const [activeAgent, setActiveAgent] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [testCases, setTestCases] = useState([{ input: 'How can you help me today?', expected_output: '' }]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const data = await apiFetch<any[]>('/agents/my');
      setAgents(data || []);
      if (data && data.length > 0 && !activeAgent) {
        setActiveAgent(data[0]);
        setSystemPrompt(data[0].description || 'You are a helpful assistant.');
      }
    } catch (e) {
      console.error('Failed to fetch agents', e);
    }
  };

  const handleRun = async () => {
    if (!activeAgent) {
      toast('Please select an agent first.', 'err');
      return;
    }
    
    setLoading(true);
    setResults(null); 
    
    try {
      const data = await apiFetch<any>('/playground/run', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: activeAgent.agent_id,
          system_prompt: systemPrompt,
          model_name: activeAgent.model_name || 'gpt-4o',
          test_cases: testCases.filter(tc => tc.input.trim() !== '')
        })
      });
      
      if (data) {
        setResults(data);
        toast('Experiment sequence finalized.', 'ok');
      } else {
        throw new Error('No data received from playground.');
      }
    } catch (e: any) {
      toast('Execution error: ' + (e.message || 'Unknown error'), 'err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.8s ease-out' }}>
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Panel: Configuration */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="ms-glass-panel flex flex-col p-6 h-full">
            <div className="flex items-center justify-between mb-8">
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="ms-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                     <Settings size={20} className="text-blue-500" />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}>EXPERIMENT_CONFIG</div>
               </div>
               <button 
                  className={`ms-btn ms-btn-p ms-btn-sm ${loading ? 'opacity-50' : ''}`} 
                  onClick={handleRun}
                  disabled={loading}
               >
                  <Play size={14} className="mr-2" /> {loading ? 'EXECUTING...' : 'RUN_TESTS'}
               </button>
            </div>

            <div className="space-y-6">
              <div className="fg">
                <label className="fl">SELECT_AGENT_PROFILE</label>
                <select className="fi" onChange={e => {
                  const agent = agents.find(a => a.agent_id === e.target.value);
                  setActiveAgent(agent);
                  if (agent) setSystemPrompt(agent.description); // Simplified: use description as prompt for now
                }}>
                  <option value="">Manual Override / New Sandbox</option>
                  {agents.map(a => <option key={a.agent_id} value={a.agent_id}>{a.name} ({a.role})</option>)}
                </select>
              </div>

              <div className="fg">
                <label className="fl">SYSTEM_DIRECTIVE_OVERRIDE</label>
                <textarea 
                  className="fi" 
                  style={{ height: 200, fontFamily: 'var(--mono)', fontSize: '11px' }} 
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder="Enter the system behavior prompt here..."
                />
              </div>

              <div className="fg">
                 <div className="flex items-center justify-between">
                    <label className="fl">TEST_SCENARIOS</label>
                    <button className="text-[var(--blue)] text-[10px] font-bold" onClick={() => setTestCases([...testCases, { input: '', expected_output: '' }])}>
                       + ADD_SCENARIO
                    </button>
                 </div>
                 <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {testCases.map((tc, idx) => (
                       <div key={idx} className="bg-[var(--bg1)] p-4 rounded-xl border border-[var(--bg3)] relative group">
                          <textarea 
                             className="fi border-none p-0 bg-transparent resize-none h-auto min-h-0" 
                             style={{ fontSize: 13 }}
                             value={tc.input} 
                             onChange={e => {
                                const newTests = [...testCases];
                                newTests[idx].input = e.target.value;
                                setTestCases(newTests);
                             }}
                             placeholder={`Test scenario #${idx + 1}...`}
                          />
                          <button 
                             className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[var(--red)] transition-opacity"
                             onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                          >
                             ✕
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Results & Analytics */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <div className="ms-glass-panel flex flex-col p-6 h-full">
             <div className="flex items-center gap-4 mb-8">
                <div className="ms-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                   <Activity size={20} className="text-blue-500" />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}>TELEMETRY_RESULTS</div>
             </div>

             {!results ? (
                <div className="flex-center flex-col h-full opacity-40">
                   <TerminalIcon size={64} className="text-[var(--bg3)] mb-6" />
                   <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '3px' }}>AWAITING_INPUT_EXECUTION...</div>
                </div>
             ) : (
                <div className="space-y-6">
                   <div className="grid grid-cols-3 gap-4">
                      <div className="ms-mini-stat">
                         <div className="val">{results.avg_latency}ms</div>
                         <div className="lbl">AVG_LATENCY</div>
                      </div>
                      <div className="ms-mini-stat">
                         <div className="val" style={{ color: 'var(--green)' }}>${results.total_cost.toFixed(4)}</div>
                         <div className="lbl">TOTAL_CREDITS</div>
                      </div>
                      <div className="ms-mini-stat">
                         <div className="val">{results.results.length}</div>
                         <div className="lbl">SESSIONS_RUN</div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      {results.results.map((res: any, idx: number) => (
                         <div key={idx} className="ms-card" style={{ background: 'transparent' }}>
                            <div className="ms-card-hd" style={{ padding: '12px 20px', borderBottom: '1px solid var(--bg3)' }}>
                               <div className="flex items-center gap-3">
                                  {res.status === 'success' ? <CheckCircle2 size={14} className="text-[var(--green)]" /> : <AlertCircle size={14} className="text-[var(--red)]" />}
                                  <span style={{ fontSize: 11, fontWeight: 800 }}>SCENARIO_OUTPUT_#0{idx+1}</span>
                               </div>
                               <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--t3)' }}>{res.latency_ms}ms | {res.tokens_used} tokens</div>
                            </div>
                            <div className="p-4 bg-[rgba(255,255,255,0.02)]">
                               <div className="text-[var(--text)] text-[13px] leading-relaxed mb-4">
                                  {res.actual_output}
                               </div>
                               <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.5px' }}>[RAW_INFERENCE_COMPLETE]</div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
