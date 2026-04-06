'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Search, 
  ShoppingBag, 
  Zap, 
  Database, 
  ArrowUpRight,
  Sparkles,
  Bot
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../ui/Toast';

const CATEGORIES = ['All Templates', 'Autonomous Agents', 'Reasoning Tools', 'Data Connectors', 'Automation Flows'];

export default function MarketplaceView() {
  const [activeCat, setActiveCat] = useState('All Templates');
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const cat = activeCat === 'All Templates' ? '' : `?category=${encodeURIComponent(activeCat)}`;
        const data = await apiFetch<any[]>(`/marketplace/templates${cat}`);
        setTemplates(data || []);
      } catch (err: any) {
        toast(err.message || 'Failed to fetch templates', 'err');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [activeCat, toast]);

  const handleDeploy = async (templateId: string) => {
    setDeploying(templateId);
    try {
      // 1. Purchase (handles free templates automatically)
      await apiFetch(`/marketplace/purchase/${templateId}`, { method: 'POST' });
      
      // 2. Deploy
      const res = await apiFetch<any>(`/marketplace/deploy/${templateId}`, { method: 'POST' });
      
      toast(`Successfully deployed unit: ${res.name}`, 'ok');
    } catch (err: any) {
      toast('Deployment failed: ' + err.message, 'err');
    } finally {
      setDeploying(null);
    }
  };

  const filtered = templates.filter(t => 
    (t.name.toLowerCase().includes(search.toLowerCase()) || 
     t.description?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="ms-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '400px' }}>
        <div className="ms-loader-ring" style={{ borderTopColor: 'var(--blue)' }}></div>
        <div style={{ marginTop: 20, color: 'var(--t3)', letterSpacing: '2px', fontSize: '10px', fontFamily: 'var(--mono)' }}>ACCESSING_GLOBAL_NEURAL_REGISTRY...</div>
      </div>
    );
  }

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
         {filtered.length === 0 ? (
           <div className="ms-glass-panel" style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', opacity: 0.5 }}>
              <Box size={48} className="mx-auto mb-4" />
              <div style={{ fontSize: '12px', fontWeight: 700 }}>NO_COMPATIBLE_BLUEPRINTS_SPECIFIED</div>
           </div>
         ) : filtered.map(t => (
            <div key={t.template_id} className="ms-glass-panel ms-template-card group">
               <div className="ms-template-header">
                  <div className="icon-wrap" style={{ color: t.category === 'Autonomous Agents' ? 'var(--blue)' : t.category === 'Data Connectors' ? 'var(--green)' : 'var(--red)' }}>
                     {t.category === 'Autonomous Agents' && <Bot size={20} />}
                     {t.category === 'Data Connectors' && <Database size={20} />}
                     {t.category === 'Reasoning Tools' && <Zap size={20} />}
                  </div>
                  <div className="flex-1">
                     <div className="name">{t.name}</div>
                     <div className="author">BY {t.creator_name}</div>
                  </div>
                  <button className="ms-btn-icon-sm"><ArrowUpRight size={14} /></button>
               </div>
               
               <div className="ms-template-body">
                  <p className="description">{t.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                     <div className="ms-badge ms-b-b" style={{ fontSize: '9px', padding: '2px 8px' }}>{t.category?.toUpperCase() || 'GENERAL'}</div>
                     <div className="rating">
                        <Sparkles size={10} style={{ color: 'var(--blue)' }} />
                        <span>{t.rating || '5.0'}</span>
                     </div>
                  </div>

                  <div className="ms-template-footer">
                     <div className="stat">
                        <span className="lbl">USAGES</span>
                        <span className="val">{t.downloads || '0'}</span>
                     </div>
                     <div className="stat text-right">
                        <span className="lbl">ALLOCATION</span>
                        <span className="val" style={{ color: 'var(--green)' }}>{t.price === 0 ? 'FREE' : `$${t.price}`}</span>
                     </div>
                  </div>

                  <button 
                    className="ms-btn ms-btn-p w-full mt-6" 
                    style={{ height: '36px', fontSize: '11px', fontWeight: 800 }}
                    disabled={deploying === t.template_id}
                    onClick={() => handleDeploy(t.template_id)}
                  >
                     {deploying === t.template_id ? 'DEPLOYING_NEURAL_UNIT...' : 'DEPLOY_TEMPLATE'}
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
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
