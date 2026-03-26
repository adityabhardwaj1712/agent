'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Search, 
  Filter, 
  ShoppingBag, 
  Zap, 
  Shield, 
  Database, 
  Plus, 
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
  Bot
} from 'lucide-react';

const CATEGORIES = ['All Templates', 'Autonomous Agents', 'Reasoning Tools', 'Data Connectors', 'Automation Flows'];

const TEMPLATES = [
  {
    id: 't1',
    name: 'Neural Researcher',
    category: 'Autonomous Agents',
    description: 'Scours web and scientific papers to synthesize deep technical reports.',
    author: 'AgentCloud Core',
    rating: 4.9,
    usage: '12.4k',
    cost: '$0.12/run',
    color: 'var(--blue)'
  },
  {
    id: 't2',
    name: 'Schema Architect',
    category: 'Data Connectors',
    description: 'Analyzes raw JSON/SQL then constructs optimized vector embedding pipelines.',
    author: 'DataOps Labs',
    rating: 4.8,
    usage: '8.2k',
    cost: '$0.05/run',
    color: 'var(--green)'
  },
  {
    id: 't3',
    name: 'Security Sentinel',
    category: 'Reasoning Tools',
    description: 'Real-time code audit and compliance enforcement for swarm operations.',
    author: 'CyberGuard',
    rating: 5.0,
    usage: '45.1k',
    cost: '$0.20/run',
    color: 'var(--red)'
  },
  {
    id: 't4',
    name: 'Marketing Maverick',
    category: 'Autonomous Agents',
    description: 'Generates SEO-optimized multi-channel campaigns based on goal directives.',
    author: 'CreativeAI',
    rating: 4.7,
    usage: '15.9k',
    cost: '$0.08/run',
    color: 'var(--pink)'
  },
  {
    id: 't5',
    name: 'Memory Pruning Bot',
    category: 'Data Connectors',
    description: 'Optimizes vector database performance by clustering and pruning stale nodes.',
    author: 'StorageEngine',
    rating: 4.6,
    usage: '2.1k',
    cost: 'Free',
    color: 'var(--violet)'
  },
  {
    id: 't6',
    name: 'Cross-Chain Oracle',
    category: 'Reasoning Tools',
    description: 'Syncs state across disparate agent clouds for large-scale decentralized ops.',
    author: 'MeshNetwork',
    rating: 4.9,
    usage: '3.4k',
    cost: '$1.00/run',
    color: 'var(--cyan)'
  }
];

export default function MarketplaceView() {
  const [activeCat, setActiveCat] = useState('All Templates');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(t => 
    (activeCat === 'All Templates' || t.category === activeCat) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="ms-content" style={{ gap: '24px', animation: 'ms-fade-in 0.8s ease-out' }}>
      {/* Header & Search */}
      <div className="ms-glass-panel" style={{ padding: '24px' }}>
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="ms-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                 <ShoppingBag size={20} style={{ color: 'var(--blue)' }} />
              </div>
              <div>
                 <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>FLEET_MARKETPLACE</div>
                 <div style={{ fontSize: '10px', color: 'var(--t3)', letterSpacing: '2px', textTransform: 'uppercase' }}>RESTORE_DECENTRALIZED_OPERATIONS</div>
              </div>
           </div>
           
           <div className="flex gap-4">
              <div className="relative" style={{ width: '320px' }}>
                 <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                 <input 
                    className="fi" 
                    style={{ width: '100%', paddingLeft: '48px', height: '44px', background: 'var(--bg1)', border: '1px solid var(--bg3)', borderRadius: '12px' }} 
                    placeholder="Search neural templates..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                 />
              </div>
              <button className="ms-btn ms-btn-g ms-btn-sm" style={{ padding: '0 20px', borderRadius: '12px' }}>
                 <Filter size={14} className="mr-2" /> Filte Protocol
              </button>
           </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
           {CATEGORIES.map(c => (
              <button 
                key={c} 
                className={`ms-category-btn ${activeCat === c ? 'active' : ''}`}
                onClick={() => setActiveCat(c)}
              >
                 {c}
              </button>
           ))}
        </div>
      </div>

      {/* Grid */}
      <div className="ms-template-grid">
         {filtered.map(t => (
            <div key={t.id} className="ms-glass-panel ms-template-card group">
               <div className="ms-template-header">
                  <div className="icon-wrap" style={{ '--sc': t.color } as any}>
                     {t.category === 'Autonomous Agents' && <Bot size={20} />}
                     {t.category === 'Data Connectors' && <Database size={20} />}
                     {t.category === 'Reasoning Tools' && <Zap size={20} />}
                  </div>
                  <div className="flex-1">
                     <div className="name">{t.name}</div>
                     <div className="author">BY {t.author}</div>
                  </div>
                  <button className="ms-btn-icon-sm"><ArrowUpRight size={14} /></button>
               </div>
               
               <div className="ms-template-body">
                  <p className="description">{t.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                     <div className="ms-badge ms-b-b" style={{ fontSize: '9px', padding: '2px 8px' }}>{t.category.toUpperCase()}</div>
                     <div className="rating">
                        <Sparkles size={10} style={{ color: 'var(--blue)' }} />
                        <span>{t.rating}</span>
                     </div>
                  </div>

                  <div className="ms-template-footer">
                     <div className="stat">
                        <span className="lbl">USAGES</span>
                        <span className="val">{t.usage}</span>
                     </div>
                     <div className="stat text-right">
                        <span className="lbl">ALLOCATION</span>
                        <span className="val" style={{ color: 'var(--green)' }}>{t.cost}</span>
                     </div>
                  </div>

                  <button className="ms-btn ms-btn-p w-full mt-6" style={{ height: '36px', fontSize: '11px', fontWeight: 800 }}>
                     DEPLOY_TEMPLATE
                  </button>
               </div>
            </div>
         ))}
      </div>

      <style jsx>{`
        .ms-category-btn {
          padding: 8px 16px;
          border-radius: 100px;
          background: transparent;
          border: 1px solid var(--bg3);
          color: var(--t2);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          transition: all 0.2s;
          cursor: pointer;
        }
        .ms-category-btn:hover { background: var(--bg2); color: var(--text); }
        .ms-category-btn.active { background: var(--blue); border-color: var(--blue); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }

        .ms-template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .ms-template-card {
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           display: flex;
           flex-direction: column;
           border-top: 2px solid transparent;
        }
        .ms-template-card:hover { transform: translateY(-4px); border-top-color: var(--blue); }

        .ms-template-header {
           padding: 24px;
           border-bottom: 1px solid var(--bg3);
           display: flex;
           align-items: center;
           gap: 16px;
        }
        .icon-wrap {
           width: 44px; height: 44px; border-radius: 12px;
           background: rgba(255,255,255,0.03);
           display: flex; align-items: center; justify-content: center;
           color: var(--sc);
           border: 1px solid rgba(255,255,255,0.05);
        }
        .ms-template-header .name { font-size: 14px; font-weight: 800; color: var(--text); }
        .ms-template-header .author { font-size: 9px; color: var(--t3); font-weight: 700; margin-top: 2px; }

        .ms-template-body { padding: 24px; flex: 1; display: flex; flex-direction: column; }
        .description { font-size: 12px; line-height: 1.6; color: var(--t2); margin-bottom: 20px; flex: 1; min-height: 56px; }

        .rating { display: flex; align-items: center; gap: 4px; font-size: 11px; font-family: var(--mono); color: var(--text); font-weight: 800; }

        .ms-template-footer { display: flex; justify-content: space-between; border-top: 1px solid var(--bg3); padding-top: 16px; }
        .ms-template-footer .stat .lbl { display: block; font-size: 8px; font-weight: 800; color: var(--t3); letter-spacing: 1px; }
        .ms-template-footer .stat .val { display: block; font-size: 11px; font-family: var(--mono); font-weight: 800; color: var(--text); margin-top: 2px; }

        .ms-btn-icon-sm { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--t3); transition: all 0.2s; }
        .ms-btn-icon-sm:hover { background: var(--bg3); color: var(--text); }
      `}</style>
    </div>
  );
}
