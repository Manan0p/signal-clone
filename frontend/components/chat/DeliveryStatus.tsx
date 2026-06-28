'use client';
import React from 'react';
import { MessageStatus } from '@/types';

export function DeliveryStatus({ status, inBubble = false }: { status: MessageStatus, inBubble?: boolean }) {
  const color = inBubble ? 'rgba(255,255,255,0.7)' : 'var(--delivered)';
  const readColor = inBubble ? '#FFFFFF' : 'var(--read)';

  if (status === 'sending') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
        <path d="M12 2a10 10 0 0 1 10 10" />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}} />
      </svg>
    );
  }

  if (status === 'sent') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  if (status === 'delivered') {
    return (
      <div style={{ position: 'relative', width: 16, height: 12 }}>
        <svg style={{ position: 'absolute', left: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg style={{ position: 'absolute', left: 4 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }

  if (status === 'read') {
    return (
      <div style={{ position: 'relative', width: 16, height: 12 }}>
        <svg style={{ position: 'absolute', left: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={readColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg style={{ position: 'absolute', left: 4 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={readColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }

  return null;
}
