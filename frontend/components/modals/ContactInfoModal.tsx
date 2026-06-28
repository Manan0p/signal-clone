'use client';
import React, { useEffect, useState } from 'react';
import { User } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { useToast } from '@/components/common/Toast';
import api from '@/lib/api';

interface ContactInfoModalProps {
  user: User;
  onClose: () => void;
}

export function ContactInfoModal({ user, onClose }: ContactInfoModalProps) {
  const { showToast } = useToast();
  const [isContact, setIsContact] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    // Check if user is in contacts
    api.get('/api/users/me/contacts')
      .then(res => {
        const contacts: User[] = res.data;
        setIsContact(contacts.some(c => c.id === user.id));
      })
      .catch(() => setIsContact(false));
  }, [user.id]);

  const handleAddContact = async () => {
    setLoading(true);
    try {
      await api.post('/api/users/me/contacts', { username: user.username });
      setIsContact(true);
      showToast('Contact added', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to add contact', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-overlay)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        width: '90%', maxWidth: 400, backgroundColor: 'var(--bg-modal)',
        borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Contact Info</span>
        </div>

        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--divider)' }}>
          <Avatar user={user} size={80} />
          <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 16 }}>{user.display_name}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>@{user.username}</p>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>About</div>
            <div style={{ fontSize: 15 }}>{user.about || 'Available'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Phone Number</div>
            <div style={{ fontSize: 15 }}>{user.phone_number}</div>
          </div>

          {isContact === false && (
            <button 
              onClick={handleAddContact}
              disabled={loading}
              style={{ 
                marginTop: 16, width: '100%', padding: 12, 
                backgroundColor: 'var(--accent)', color: '#fff', 
                borderRadius: 8, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              {loading ? 'Adding...' : 'Add to Contacts'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
