'use client';
import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div style={{ padding: '8px 16px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--divider)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--bg-input)',
        borderRadius: 8,
        padding: '6px 12px',
        gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
}
