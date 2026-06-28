'use client';
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  isLeaving?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastItem['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 350);
    }, 3500);
  }, []);

  const bgColor = (type: ToastItem['type']) => {
    switch (type) {
      case 'success': return '#4DB6AC';
      case 'error': return '#E57373';
      case 'warning': return '#FFD54F';
      default: return '#2C6BED';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: bgColor(toast.type),
              color: '#fff',
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              animation: toast.isLeaving
                ? 'toastSlideOut 350ms ease forwards'
                : 'toastSlideIn 300ms ease forwards',
              maxWidth: 320,
              pointerEvents: 'auto',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
