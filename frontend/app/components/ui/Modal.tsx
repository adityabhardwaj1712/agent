'use client';
import React from 'react';

interface ModalProps { 
  open: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode; 
  footer?: React.ReactNode; 
  width?: number 
}

export default function Modal({ open, onClose, title, children, footer, width = 540 }: ModalProps) {
  if (!open) return null;
  return (
    <div 
      style={{ 
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        animation: 'fadeIn 0.3s ease'
      }} 
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="ms-panel" 
        style={{ 
          width, maxWidth: '90vw', padding: 0, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 1px 1px var(--bg3)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div 
          className="ms-card-hd" 
          style={{ 
            padding: '20px 24px', borderBottom: '1px solid var(--bg3)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}
        >
          <div className="ms-card-title" style={{ fontSize: 16 }}>{title}</div>
          <button 
            style={{ background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 20 }} 
            onClick={onClose}
          >✕</button>
        </div>
        
        <div style={{ padding: '24px' }}>
          {children}
        </div>
        
        {footer && (
          <div 
            style={{ 
              padding: '16px 24px', background: 'var(--bg1)', borderTop: '1px solid var(--bg3)',
              display: 'flex', justifyContent: 'flex-end', gap: 12
            }}
          >
            {footer}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
