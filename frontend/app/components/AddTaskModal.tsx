'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from './Toast';

export default function AddTaskModal({ isOpen, onClose, onAdded }: { isOpen: boolean, onClose: () => void, onAdded: () => void }) {
  const [formData, setFormData] = useState({ description: '', agent_id: '', payload: '' });
  const [agents, setAgents] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) fetchAgents();
  }, [isOpen]);

  const fetchAgents = async () => {
    try {
      const data = await apiFetch<any[]>('/agents');
      setAgents(data);
      if (data.length > 0) setFormData(p => ({ ...p, agent_id: data[0].agent_id }));
    } catch (err) {}
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/tasks/', {
        method: 'POST',
        body: JSON.stringify({ ...formData, payload: formData.description })
      });
      toast('Task dispatched to agent', 'ok');
      onAdded();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Dispatch failed', 'err');
    }
  };

  return (
    <div className={`overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">Initialize Task</div>
          <button className="ms-btn ms-btn-g ms-btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="fg">
              <label className="fl">Select Agent</label>
              <select className="fi" required value={formData.agent_id} onChange={e => setFormData({...formData, agent_id: e.target.value})}>
                {agents.map(a => <option key={a.agent_id} value={a.agent_id}>{a.name} ({a.role})</option>)}
                {agents.length === 0 && <option disabled>No agents found</option>}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Task Objective</label>
              <textarea className="fi" required style={{ height: 100 }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What should the agent do?" />
            </div>
            <div className="modal-ft" style={{ padding: 0, border: 'none' }}>
              <button type="button" className="ms-btn ms-btn-g" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="ms-btn ms-btn-p" style={{ flex: 1 }}>Dispatch Task</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
