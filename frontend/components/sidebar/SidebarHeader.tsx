'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/common/Avatar';
import { useToast } from '@/components/common/Toast';

interface SidebarHeaderProps {
  onOpenSettings: () => void;
  onNewConversation: () => void;
}

export function SidebarHeader({ onOpenSettings, onNewConversation }: SidebarHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--divider)',
      backgroundColor: 'var(--bg-secondary)',
    }}>
      <div onClick={onOpenSettings} style={{ cursor: 'pointer' }}>
        <Avatar user={user} size={32} />
      </div>
      
      <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)' }}>
        <button onClick={onNewConversation} title="New Conversation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button title="Menu" onClick={() => setShowMenu(!showMenu)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              backgroundColor: 'var(--bg-modal)',
              borderRadius: 8,
              boxShadow: 'var(--shadow-lg)',
              minWidth: 160,
              zIndex: 100,
              overflow: 'hidden',
              border: '1px solid var(--divider)'
            }}>
              <div 
                onClick={() => {
                  setShowMenu(false);
                  showToast('Stories coming soon', 'info');
                }}
                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', borderBottom: '1px solid var(--divider)' }}
                className="hover:bg-[var(--bg-hover)] transition-colors"
              >
                Stories
              </div>
              <div 
                onClick={() => {
                  setShowMenu(false);
                  onOpenSettings();
                }}
                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}
                className="hover:bg-[var(--bg-hover)] transition-colors"
              >
                Settings
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
