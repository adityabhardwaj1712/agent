'use client';

import React, { useState } from 'react';
import { 
  Radio as RadioIcon, 
  Send, 
  User, 
  Cpu, 
  Zap, 
  MessageSquare, 
  Share2, 
  ShieldCheck, 
  Activity,
  Terminal as TerminalIcon,
  ChevronsRight
} from 'lucide-react';
import { useToast } from './Toast';
import { apiFetch } from '../lib/api';
import CollaborationGraph from './CollaborationGraph';


const AGENTS = ['TaskOrchestrator', 'WebResearcher', 'DataAnalyst', 'CodeHelper', 'ContentWriter', 'SecurityGuardian', 'FleetSummarizer'];
const INIT_MSGS = [
  { from: 'TaskOrchestrator', to: 'WebResearcher', type: 'delegate_task', payload: 'Research Q2 market trends for e-commerce', t: '5M_AGO' },
  { from: 'WebResearcher', to: 'DataAnalyst', type: 'share_result', payload: 'Found 12 relevant articles. Summary attached.', t: '8M_AGO' },
  { from: 'DataAnalyst', to: 'TaskOrchestrator', type: 'share_result', payload: 'Analysis complete. Key insights: 3 growth areas identified.', t: '12M_AGO' },
  { from: 'SecurityGuardian', to: 'CodeHelper', type: 'request_memory', payload: 'Fetch last 10 tool calls for audit review', t: '15M_AGO' },
  { from: 'CodeHelper', to: 'SecurityGuardian', type: 'share_result', payload: 'Tool call history exported to audit log.', t: '18M_AGO' },
];

export default function ProtocolView() {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'graph'>('feed');
  const [from, setFrom] = useState(AGENTS[0]);
  const [to, setTo] = useState(AGENTS[1]);
  const [type, setType] = useState('delegate_task');
  const [payload, setPayload] = useState('');
  const toast = useToast();

  const fetchMessages = async () => {
    try {
      const data = await apiFetch<any[]>('/protocol/messages');
      setMsgs(data || []);
    } catch (err) {
      console.error('Failed to fetch protocol messages:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMessages();
    
    // Initialize Protocol WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/api/v1/protocol/demo-user`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SIGNAL' && data.signal_type === 'PROTOCOL_MESSAGE') {
          setMsgs(prev => [data.payload, ...prev].slice(0, 50));
        }
      } catch (e) {
        console.error('WS Message parsing failed', e);
      }
    };

    ws.onopen = () => console.log('Protocol Mesh WebSocket Connected');
    ws.onclose = () => console.log('Protocol Mesh WebSocket Disconnected');

    return () => ws.close();
  }, []);

  const send = async () => {
    if (!payload.trim()) { toast('Payload required', 'warn'); return; }
    try {
      await apiFetch('/protocol/send', {
        method: 'POST',
        body: JSON.stringify({
          from_agent_id: from,
          to_agent_id: to,
          type: type,
          payload: payload,
          correlation_id: `corr-${Date.now()}`
        })
      });
      toast(`Protocol Packet Dispatched: ${from} → ${to}`, 'ok');
      setPayload('');
      fetchMessages();
    } catch (err) {
      toast('Dispatch Failed', 'err');
    }
  };

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.7s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '28px', flex: 1, minHeight: 0 }}>
        
        {/* Left: Message Feed */}
        <div className="ms-glass-panel flex flex-col">
          <div className="ms-card-hd" style={{ padding: '0 24px', borderBottom: '1px solid var(--bg3)', height: 64 }}>
             <div className="flex items-center gap-8 h-full">
                <button 
                  className={`flex items-center gap-2 h-full px-2 border-b-2 transition-all ${activeTab === 'feed' ? 'border-[var(--blue)] text-[var(--text)]' : 'border-transparent text-[var(--t3)]'}`}
                  onClick={() => setActiveTab('feed')}
                >
                   <RadioIcon size={16} /> 
                   <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: 1 }}>SIGNAL_FEED</span>
                </button>
                <button 
                  className={`flex items-center gap-2 h-full px-2 border-b-2 transition-all ${activeTab === 'graph' ? 'border-[var(--blue)] text-[var(--text)]' : 'border-transparent text-[var(--t3)]'}`}
                  onClick={() => setActiveTab('graph')}
                >
                   <Share2 size={16} /> 
                   <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: 1 }}>COLLABORATION_GRAPH</span>
                </button>
             </div>
             <div className="flex items-center gap-3">
                <div className="ms-dot ms-dot-g animate-pulse"></div>
                <span className="text-[10px] font-mono text-[var(--t3)]">UDP_SYNC: ACTIVE</span>
             </div>
          </div>

          <div className="ms-protocol-scroll">
            {activeTab === 'graph' ? (
              <CollaborationGraph />
            ) : msgs.length === 0 ? (
              <div className="flex-center flex-col py-32 opacity-30">
                 <Activity size={48} style={{ marginBottom: 16 }} />
                 <div style={{ fontSize: '12px', fontWeight: 600 }}>NO_INTER_AGENT_SIGNALS</div>
              </div>
            ) : (
              <div className="ms-protocol-feed">
                {msgs.map((m, i) => (
                  <div key={i} className="ms-protocol-packet group">
                    <div className="ms-packet-side">
                       <div className="ms-agent-mini-ava"><Cpu size={14} /></div>
                       <div className="ms-packet-line"></div>
                    </div>
                    
                    <div className="ms-packet-content">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="from">{m.from_agent_id}</span>
                          <ChevronsRight size={10} style={{ color: 'var(--t3)' }} />
                          <span className="to">{m.to_agent_id}</span>
                        </div>
                        <span className="time">{new Date(m.created_at).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="ms-packet-payload">
                        {m.payload}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3">
                         <div className="ms-badge ms-b-p" style={{ fontSize: '9px', padding: '2px 8px' }}>{m.message_type?.toUpperCase()}</div>
                         <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="ms-btn-icon-xs"><TerminalIcon size={12} /></button>
                            <button className="ms-btn-icon-xs"><Share2 size={12} /></button>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Dispatch Console */}
        <div className="ms-glass-panel flex flex-col" style={{ height: 'fit-content' }}>
          <div className="ms-card-hd" style={{ padding: '20px 24px', borderBottom: '1px solid var(--bg3)' }}>
             <div className="flex items-center gap-3">
                <Send size={16} style={{ color: 'var(--blue)' }} />
                <span style={{ fontSize: '12px', fontWeight: 800 }}>DISPATCH_CONSOLE</span>
             </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="ms-field-group">
               <label>SOURCE_AGENT</label>
               <select className="fi" value={from} onChange={e => setFrom(e.target.value)}>
                 {AGENTS.map(a => <option key={a}>{a}</option>)}
               </select>
            </div>

            <div className="ms-field-group">
               <label>TARGET_ENTITY</label>
               <select className="fi" value={to} onChange={e => setTo(e.target.value)}>
                 {AGENTS.map(a => <option key={a}>{a}</option>)}
               </select>
            </div>

            <div className="ms-field-group">
               <label>PACKET_TYPE</label>
               <select className="fi" value={type} onChange={e => setType(e.target.value)}>
                 <option value="delegate_task">DELEGATE_TASK</option>
                 <option value="request_memory">REQUEST_MEMORY</option>
                 <option value="share_result">SHARE_RESULT</option>
                 <option value="heartbeat">HEARTBEAT</option>
               </select>
            </div>

            <div className="ms-field-group">
               <label>RAW_PAYLOAD</label>
               <textarea 
                  className="fi" 
                  style={{ height: '120px', padding: '12px', fontSize: '12px', resize: 'none', background: 'var(--bg1)', color: 'var(--text)', border: '1px solid var(--bg3)', borderRadius: '8px' }}
                  value={payload} 
                  onChange={e => setPayload(e.target.value)} 
                  placeholder='Enter mission details or data structures...' 
               />
            </div>

            <button className="ms-btn ms-btn-p w-full" style={{ height: '48px', fontSize: '12px', fontWeight: 800 }} onClick={send}>
               BROADCAST_PACKET <Send size={14} className="ml-2" />
            </button>
          </div>
          
          <div className="px-6 pb-6">
             <div className="p-4 rounded-xl bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.1)]">
                <div className="text-[10px] text-[var(--blue)] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                   <ShieldCheck size={12} /> Encrypted Transmission
                </div>
                <p className="text-[9px] leading-relaxed text-[var(--t3)] italic">
                   "A2A communication is routed through the Axon-Protocol mesh with end-to-end vector encryption enabled."
                </p>
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ms-protocol-scroll { flex: 1; overflow-y: auto; padding: 20px; }
        .ms-protocol-feed { display: flex; flex-direction: column; }
        
        .ms-protocol-packet { display: flex; gap: 20px; margin-bottom: 24px; }
        .ms-protocol-packet:last-child { margin-bottom: 0; }
        
        .ms-packet-side { display: flex; flex-direction: column; align-items: center; }
        .ms-agent-mini-ava { 
          width: 32px; height: 32px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bg3);
          display: flex; align-items: center; justify-content: center; color: var(--blue);
        }
        .ms-packet-line { width: 1px; flex: 1; background: var(--bg3); margin-top: 8px; min-height: 40px; }
        .ms-protocol-packet:last-child .ms-packet-line { display: none; }
        
        .ms-packet-content { flex: 1; min-width: 0; padding-top: 4px; }
        .ms-packet-content .from { font-size: 13px; font-weight: 800; color: var(--text); }
        .ms-packet-content .to { font-size: 12px; font-weight: 700; color: var(--t2); }
        .ms-packet-content .time { font-size: 10px; font-family: var(--mono); color: var(--t3); }
        
        .ms-packet-payload { 
          font-size: 12px; line-height: 1.5; color: var(--t2); background: rgba(0,0,0,0.2); 
          padding: 12px 16px; border-radius: 10px; border: 1px solid var(--bg3); margin-top: 8px;
        }
        
        .ms-field-group { display: flex; flex-direction: column; gap: 8px; }
        .ms-field-group label { font-size: 10px; font-weight: 800; color: var(--t3); letter-spacing: 1px; }
        
        .ms-btn-icon-xs { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--t3); transition: all 0.2s; }
        .ms-btn-icon-xs:hover { background: var(--bg3); color: var(--text); }
      `}</style>
    </div>
  );
}
