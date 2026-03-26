'use client';
import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

export default function AddAgentModal({ isOpen, onClose, onAdded }: { isOpen: boolean, onClose: () => void, onAdded: () => void }) {
  const [formData, setFormData] = useState({ name: '', role: '', description: '', model_name: 'gpt-4o' });
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/agents/register', {
        method: 'POST',
        body: JSON.stringify({ ...formData, owner_id: 'demo-user' })
      });
      toast('Agent registered successfully', 'ok');
      onAdded();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'err');
    }
  };

  return (
    <div className={`overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">REGISTER_NEURAL_AGENT</div>
          <button className="ms-btn ms-btn-g ms-btn-sm" onClick={onClose} style={{ width: 32, height: 32, padding: 0 }}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="fg">
              <label className="fl">Agent Identity</label>
              <input className="fi" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. ResearchBot_v2" />
            </div>
            <div className="fg">
              <label className="fl">Operational Role</label>
              <input className="fi" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Core Web Researcher" />
            </div>
            <div className="fg">
              <label className="fl">Inference Model</label>
              <select className="fi" value={formData.model_name} onChange={e => setFormData({...formData, model_name: e.target.value})}>
                <option value="gpt-4o">GPT-4o (Default)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Efficiency)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Logic)</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Mission Directives</label>
              <textarea className="fi" style={{ height: 100 }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe primary autonomous capabilities..." />
            </div>
            <div className="modal-ft" style={{ padding: '24px 0 0', border: 'none' }}>
              <button type="button" className="ms-btn ms-btn-g" style={{ flex: 1 }} onClick={onClose}>ABORT</button>
              <button type="submit" className="ms-btn ms-btn-p" style={{ flex: 1 }}>REGISTER_PROTOCOL</button>
            </div>
          </form>
        </div>
      </div>
    </div>

  );
}
