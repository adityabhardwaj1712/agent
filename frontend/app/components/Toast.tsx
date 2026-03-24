'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'ok' | 'warn' | 'err' | 'info';
interface ToastItem { id: number; msg: string; type: ToastType }

const ToastCtx = createContext<(msg: string, type?: ToastType) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

let _id = 0;
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = ++_id;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  const icons: Record<ToastType, string> = { ok: '✓', warn: '⚠', err: '✕', info: 'ℹ' };
  const cols: Record<ToastType, string> = { ok: 'var(--g)', warn: 'var(--y)', err: 'var(--r)', info: 'var(--a)' };
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span style={{ color: cols[t.type], fontSize: 13 }}>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
