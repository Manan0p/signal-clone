'use client';
import React from 'react';

export function TypingIndicator({ name }: { name?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12 }}>
      {name && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{name} is typing</span>}
      <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: 16, borderBottomLeftRadius: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-secondary)', animation: 'typingBounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-secondary)', animation: 'typingBounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-secondary)', animation: 'typingBounce 1.4s infinite ease-in-out both' }} />
      </div>
    </div>
  );
}
