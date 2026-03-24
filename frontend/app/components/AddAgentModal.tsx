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
          <div className="modal-title">Register New Agent</div>
          <button className="ms-btn ms-btn-g ms-btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="fg">
              <label className="fl">Agent Name</label>
              <input className="fi" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. ResearchBot" />
            </div>
            <div className="fg">
              <label className="fl">Role / Expertise</label>
              <input className="fi" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Web Researcher" />
            </div>
            <div className="fg">
              <label className="fl">Model</label>
              <select className="fi" value={formData.model_name} onChange={e => setFormData({...formData, model_name: e.target.value})}>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Description</label>
              <textarea className="fi" style={{ height: 80 }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What does this agent do?" />
            </div>
            <div className="modal-ft" style={{ padding: 0, border: 'none' }}>
              <button type="button" className="ms-btn ms-btn-g" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="ms-btn ms-btn-p" style={{ flex: 1 }}>Register Agent</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
