'use client';

import React, { useState } from 'react';
import { apiJson } from '../lib/api';

const AGENTS = [
  {
    cat: 'productivity',
    icon: '📝',
    top: true,
    name: 'MeetingScribe',
    role: 'Meeting Intelligence',
    desc: 'Joins your calendar, transcribes meetings via webhook, extracts action items, assigns owners, and posts a summary to Slack.',
    tools: ['web_fetch', 'slack_message', 'calculate'],
    model: 'claude-haiku',
    badge: 'b-a',
    blabel: 'Free tier',
    tag: 'Meetings'
  },
  {
    cat: 'devops',
    icon: '🔁',
    top: true,
    name: 'CIPipelineAgent',
    role: 'DevOps Engineer',
    desc: 'Monitors CI/CD runs, detects failures, reads error logs, identifies root cause using LLM reasoning, and posts fix suggestions.',
    tools: ['github_create_issue', 'github_search_code', 'web_fetch'],
    model: 'claude-sonnet',
    badge: 'b-r',
    blabel: 'Powerful',
    tag: 'CI/CD'
  },
  {
    cat: 'data',
    icon: '📊',
    top: true,
    name: 'ReportGeneratorAgent',
    role: 'Business Analyst',
    desc: 'Pulls data from analytics API, computes trends, finds anomalies, and generates weekly business reports in Markdown.',
    tools: ['web_fetch', 'python_interpreter', 'calculate'],
    model: 'gpt-4o',
    badge: 'b-r',
    blabel: 'Powerful',
    tag: 'Reporting'
  },
  {
    cat: 'security',
    icon: '🔒',
    top: true,
    name: 'SecurityScannerAgent',
    role: 'AppSec Engineer',
    desc: 'Scans API endpoints for vulnerabilities: exposed secrets, SQL injection, missing auth headers, and open CORS.',
    tools: ['web_fetch', 'python_interpreter', 'google_search'],
    model: 'gpt-4o',
    badge: 'b-r',
    blabel: 'Powerful',
    tag: 'AppSec'
  }
];

export default function AgentGallery() {
  const [filter, setFilter] = useState('all');
  const [registering, setRegistering] = useState<string | null>(null);

  const filteredAgents = filter === 'all' ? AGENTS : AGENTS.filter(a => a.cat === filter);

  const handleAddToFleet = async (agent: typeof AGENTS[0]) => {
    setRegistering(agent.name);
    try {
      const res = await apiJson<any>('/agents/register', {
        method: 'POST',
        json: {
          name: agent.name,
          role: agent.role,
          description: agent.desc,
          personality_config: { tone: "Professional", traits: [agent.tag] },
          scopes: agent.tools,
          owner_id: "system"
        }
      });
      if (res.ok) {
        alert(`${agent.name} successfully deployed to your fleet!`);
      } else {
        alert(`Failed to deploy agent: ${(res.error as any)?.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert("Network error while registering agent.");
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-slide-in">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight uppercase italic">Agent Marketplace</h3>
          <p className="text-[10px] text-tertiary uppercase tracking-[0.2em] mt-1">Deploy high-performance neural entities to your autonomous network.</p>
        </div>
        <div className="flex gap-3">
          {['all', 'productivity', 'devops', 'data', 'security'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`ac-chip px-4 py-2 transition-all ${
                filter === cat 
                  ? 'border-a bg-a/10 text-a' 
                  : 'hover:border-border2'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {filteredAgents.map((agent, i) => (
          <div 
            key={i} 
            className="ac-widget flex flex-col h-full group transition-all duration-500 hover:border-a/40 relative"
          >
            {agent.top && (
               <div className="absolute -top-2 -right-2 bg-a text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-lg z-20">
                 Elite Unit
               </div>
            )}

            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-bg3 border border-border/50 group-hover:rotate-12 transition-transform">
                {agent.icon}
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${agent.badge === 'b-a' ? 'border-g/30 text-g bg-g/5' : 'border-a/30 text-a bg-a/5'}`}>
                {agent.blabel}
              </span>
            </div>
            
            <h4 className="text-lg font-bold text-white mb-1 group-hover:text-a transition-colors">{agent.name}</h4>
            <div className="text-[10px] text-tertiary mb-4 uppercase tracking-[0.15em] font-bold">{agent.role}</div>
            <p className="text-xs text-t2 leading-relaxed mb-6 flex-1">{agent.desc}</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {agent.tools.map(tool => (
                <span key={tool} className="text-[9px] px-2 py-1 rounded bg-bg3 border border-border/30 text-tertiary font-mono">
                  {tool}
                </span>
              ))}
            </div>

            <button 
              className={`btn btn-md w-full ${registering === agent.name ? 'opacity-50 cursor-wait' : (agent.badge === 'b-a' ? 'btn-g' : 'btn-a')}`}
              disabled={registering !== null}
              onClick={() => handleAddToFleet(agent)}
            >
               {registering === agent.name ? 'DEPLOYING...' : 'ADD TO FLEET'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
