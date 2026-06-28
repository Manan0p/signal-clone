'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, SIGNAL_AVATAR_COLORS } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { useConversationStore } from '@/stores/conversationStore';
import { useToast } from '@/components/common/Toast';
import api from '@/lib/api';

interface NewGroupModalProps {
  onClose: () => void;
  onBack: () => void;
  contacts: User[];
}

export function NewGroupModal({ onClose, onBack, contacts }: NewGroupModalProps) {
  const router = useRouter();
  const { addOrUpdateConversation } = useConversationStore();
  const { showToast } = useToast();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [groupName, setGroupName] = useState('');
  const [avatarColor, setAvatarColor] = useState(SIGNAL_AVATAR_COLORS[3]);
  const [loading, setLoading] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const lower = search.toLowerCase();
    return contacts.filter(c => c.display_name.toLowerCase().includes(lower) || c.username.toLowerCase().includes(lower));
  }, [contacts, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }
    if (selectedIds.size === 0) {
      showToast('Select at least one member', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/api/groups', {
        name: groupName.trim(),
        member_ids: Array.from(selectedIds),
        avatar_color: avatarColor,
      });
      addOrUpdateConversation(res.data);
      router.push(`/${res.data.id}`);
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create group', 'error');
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
        height: '80vh', boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={step === 1 ? onBack : () => setStep(1)} style={{ color: 'var(--text-secondary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {step === 1 ? 'New Group' : 'Name Group'}
            </span>
          </div>
          {step === 1 && (
            <button 
              onClick={() => { if (selectedIds.size > 0) setStep(2); }}
              style={{ color: selectedIds.size > 0 ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 600, opacity: selectedIds.size > 0 ? 1 : 0.5 }}
              disabled={selectedIds.size === 0}
            >
              Next
            </button>
          )}
          {step === 2 && (
            <button 
              onClick={handleCreateGroup}
              style={{ color: 'var(--accent)', fontWeight: 600 }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          )}
        </div>

        {step === 1 ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: selectedIds.size > 0 ? 12 : 0 }}>
                {Array.from(selectedIds).map(id => {
                  const u = contacts.find(c => c.id === id);
                  if (!u) return null;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--bg-tertiary)', padding: '4px 8px 4px 4px', borderRadius: 16, fontSize: 13 }}>
                      <Avatar user={u} size={24} />
                      {u.display_name.split(' ')[0]}
                      <button onClick={() => toggleSelect(id)} style={{ color: 'var(--text-secondary)' }}>&times;</button>
                    </div>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Search contacts"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)' }}
              />
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredContacts.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>No contacts found</div>
              ) : (
                filteredContacts.map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleSelect(u.id)}
                    style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
                    className="hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid var(--text-tertiary)', marginRight: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: selectedIds.has(u.id) ? 'var(--accent)' : 'transparent', borderColor: selectedIds.has(u.id) ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                      {selectedIds.has(u.id) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <Avatar user={u} />
                    <span style={{ marginLeft: 12, fontWeight: 500 }}>{u.display_name}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 600, color: '#fff', marginBottom: 24 }}>
              {groupName ? groupName.charAt(0).toUpperCase() : '?'}
            </div>
            
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
              {SIGNAL_AVATAR_COLORS.map(color => (
                <div 
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: color, cursor: 'pointer', border: avatarColor === color ? '2px solid var(--text-primary)' : '2px solid transparent' }}
                />
              ))}
            </div>

            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              style={{ padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 16, textAlign: 'center', width: '100%' }}
              autoFocus
            />
            
            <p style={{ marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
              {selectedIds.size} members selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
