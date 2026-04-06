'use client';
import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function AddTaskModal({ isOpen, onClose, onAdded }: { isOpen: boolean; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [payload, setPayload] = useState('');

  const create = async () => {
    try {
      await apiFetch('/tasks/', {
        method: 'POST',
        json: { payload: payload || name || 'MISSION_SIG', priority: priority.toLowerCase() },
      });
      onAdded(); onClose();
    } catch { onAdded(); onClose(); }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ border: '1px solid var(--purple)', boxShadow: '0 0 30px rgba(112,0,255,0.3)' }}>
        <div className="modal-title" style={{ color: 'var(--purple)', fontFamily: 'var(--mono)' }}>ENQUEUE_NEW_MISSION...</div>
        <div className="modal-sub">PRIORITY_QUEUE_LINK_ESTABLISHED</div>
        
        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>MISSION_IDENTIFIER</label>
          <input type="text" placeholder="e.g. DATA_HARVEST_ALPHA" value={name} onChange={e => setName(e.target.value)} />
        </div>
        
        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>THREAT_LEVEL_PRIORITY</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option>HIGH</option><option>MEDIUM</option><option>LOW</option>
          </select>
        </div>

        <div className="modal-field">
          <label style={{ fontSize: '9px', opacity: 0.6 }}>PAYLOAD_STREAM</label>
          <textarea rows={3} placeholder="MISSION_COMMANDS..." value={payload} onChange={e => setPayload(e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>[ CANCEL ]</button>
          <button className="btn btn-primary btn-sm" style={{ background: 'var(--purple)', color: '#fff' }} onClick={create}>[ DISPATCH_MISSION ]</button>
        </div>
      </div>
    </div>
  );
}
