'use client';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/common/Avatar';
import { useToast } from '@/components/common/Toast';
import api from '@/lib/api';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { user, logout, updateUser } = useAuthStore();
  const { showToast } = useToast();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.display_name || '');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [editAbout, setEditAbout] = useState(user?.about || '');

  useEffect(() => {
    // Detect theme on mount
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    setTheme(currentTheme || 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    setTheme(nextTheme);
  };

  const handleSaveProfile = async (field: 'display_name' | 'about', value: string) => {
    try {
      await api.patch('/api/users/me', { [field]: value });
      updateUser({ [field]: value });
      showToast('Profile updated', 'success');
      if (field === 'display_name') setIsEditingName(false);
      if (field === 'about') setIsEditingAbout(false);
    } catch {
      showToast('Failed to update profile', 'error');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-primary)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInLeft 200ms ease forwards',
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Settings</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Profile */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--divider)' }}>
          <Avatar user={user} size={80} />
          
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEditingName ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleSaveProfile('display_name', editName)}
                onKeyDown={e => e.key === 'Enter' && handleSaveProfile('display_name', editName)}
                style={{ fontSize: 20, fontWeight: 600, textAlign: 'center', borderBottom: '1px solid var(--accent)', paddingBottom: 2 }}
              />
            ) : (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>{user?.display_name}</h2>
                <button onClick={() => setIsEditingName(true)} style={{ color: 'var(--text-tertiary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </>
            )}
          </div>
          
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{user?.phone_number}</p>
          
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' }}>
            {isEditingAbout ? (
              <input
                autoFocus
                value={editAbout}
                onChange={e => setEditAbout(e.target.value)}
                onBlur={() => handleSaveProfile('about', editAbout)}
                onKeyDown={e => e.key === 'Enter' && handleSaveProfile('about', editAbout)}
                style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', borderBottom: '1px solid var(--accent)', paddingBottom: 2, width: '80%' }}
              />
            ) : (
              <>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user?.about}</p>
                <button onClick={() => setIsEditingAbout(true)} style={{ color: 'var(--text-tertiary)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Options */}
        <div style={{ padding: '8px 0' }}>
          <div 
            onClick={toggleTheme}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', cursor: 'pointer' }}
            className="hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {theme === 'dark' 
                  ? <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></>
                  : <><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></>
                }
              </svg>
              <span>Appearance</span>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </div>

          {[
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>, label: 'Privacy' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>, label: 'Notifications' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>, label: 'Linked Devices' },
          ].map(item => (
            <div 
              key={item.label}
              onClick={() => showToast('Coming soon', 'info')}
              style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', cursor: 'pointer', gap: 16 }}
              className="hover:bg-[var(--bg-hover)] transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}

          <div style={{ height: 1, backgroundColor: 'var(--divider)', margin: '16px 0' }} />

          <div 
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', cursor: 'pointer', gap: 16, color: 'var(--danger)' }}
            className="hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Log Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}
