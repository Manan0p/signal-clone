'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useToast } from '@/components/common/Toast';
import { NewGroupModal } from './NewGroupModal';
import api from '@/lib/api';

export function NewConversationModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { addOrUpdateConversation } = useConversationStore();
  const { showToast } = useToast();
  
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    // Esc key to close
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    // Load contacts on mount
    api.get('/api/users/me/contacts')
      .then(res => setContacts(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/users/search?q=${search}`);
        setSearchResults(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStartConversation = async (otherUser: User) => {
    try {
      const res = await api.post('/api/conversations', { other_user_id: otherUser.id });
      addOrUpdateConversation(res.data);
      router.push(`/${res.data.id}`);
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to start conversation', 'error');
    }
  };

  const handleAddContact = async (username: string) => {
    try {
      await api.post('/api/users/me/contacts', { username });
      showToast('Contact added', 'success');
      // Refresh contacts
      const res = await api.get('/api/users/me/contacts');
      setContacts(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to add contact', 'error');
    }
  };

  if (showNewGroup) {
    return <NewGroupModal onClose={onClose} onBack={() => setShowNewGroup(false)} contacts={contacts} />;
  }

  const displayList = search.length >= 2 ? searchResults : contacts;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-overlay)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        width: '90%', maxWidth: 400, backgroundColor: 'var(--bg-modal)',
        borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '80vh', boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>New Message</span>
        </div>

        {/* Search */}
        <div style={{ padding: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-input)',
            borderRadius: 8, padding: '8px 12px', gap: 8
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search by username, name, or phone"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
        </div>

        {/* New Group Button */}
        {!search && (
          <div 
            onClick={() => setShowNewGroup(true)}
            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', borderBottom: '1px solid var(--divider)' }}
            className="hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <span style={{ fontWeight: 500 }}>New Group</span>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>Searching...</div>
          ) : displayList.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              {search.length >= 2 ? 'No users found' : 'No contacts yet'}
            </div>
          ) : (
            <div>
              {search.length < 2 && <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Contacts</div>}
              {displayList.map(u => (
                <div
                  key={u.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
                  className="hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }} onClick={() => handleStartConversation(u)}>
                    <Avatar user={u} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{u.display_name}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>@{u.username}</span>
                    </div>
                  </div>
                  
                  {/* Add contact button if searching and not in contacts */}
                  {search.length >= 2 && !contacts.some(c => c.id === u.id) && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAddContact(u.username); }}
                      style={{ padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 16, fontSize: 13, fontWeight: 500 }}
                    >
                      Add Contact
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
