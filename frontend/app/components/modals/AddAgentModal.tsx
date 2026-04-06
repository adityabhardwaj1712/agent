'use client';
import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function AddAgentModal({ isOpen, onClose, onAdded }: { isOpen: boolean; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Worker');
  const [model, setModel] = useState('gemma-3-4b');
  const [desc, setDesc] = useState('');

  const deploy = async () => {
    try {
      await apiFetch('/agents/', {
        method: 'POST',
        json: { name: name || 'UNIT_X', role, model, system_prompt: desc || 'GENERAL_PURPOSE_OPS' },
      });
      onAdded(); onClose();
    } catch { onAdded(); onClose(); }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ border: '1px solid var(--cyan)', boxShadow: 'var(--glow-lg)' }}>
        <div className="scanline"></div>
        <div className="modal-title" style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>DECOMPILING_NEW_UNIT...</div>
        <div className="modal-sub">SECURE_INITIALIZATION_PROTOCOL_V4.2</div>
        
        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>CALLSIGN_ASSIGNMENT</label>
          <input type="text" placeholder="e.g. OMEGA_LEADER" value={name} onChange={e => setName(e.target.value)} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="modal-field">
            <label style={{ fontSize: '9px', opacity: 0.6 }}>CLASS_STANCE</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option>Worker</option><option>Core</option><option>Storage</option><option>Analytics</option>
            </select>
          </div>
          <div className="modal-field">
            <label style={{ fontSize: '9px', opacity: 0.6 }}>NEURAL_ENGINE</label>
            <select value={model} onChange={e => setModel(e.target.value)}>
              <option>gemma-3-4b</option><option>llama-3-70b</option>
              <option>claude-3-5-sonnet</option><option>gpt-4o-mini</option>
            </select>
          </div>
        </div>

        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>MISSION_PARAMETERS</label>
          <textarea rows={2} placeholder="DEFINE_OBJECTIVES..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>[ ABORT ]</button>
          <button className="btn btn-primary btn-sm" style={{ background: 'var(--cyan)', color: '#000' }} onClick={deploy}>[ INITIATE_DEPLOYMENT ]</button>
        </div>
      </div>
    </div>
  );
}
