'use client';
import React, { useEffect, useState } from 'react';
import { Conversation, Participant } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/common/Toast';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface GroupInfoModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export function GroupInfoModal({ conversation, onClose }: GroupInfoModalProps) {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { showToast } = useToast();
  
  const [members, setMembers] = useState<Participant[]>(conversation.participants);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Esc key to close
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin';

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/groups/${conversation.id}/members/${user?.id}`);
      onClose();
      router.push('/');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to leave group', 'error');
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/groups/${conversation.id}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      showToast('Member removed', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to remove member', 'error');
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
        maxHeight: '80vh', boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Group Info</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--divider)' }}>
            <Avatar name={conversation.name || '?'} color={conversation.avatar_color || '#7986CB'} size={80} />
            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 16 }}>{conversation.name}</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{members.length} members</p>
          </div>

          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Members</h3>
              {isAdmin && (
                <button onClick={() => showToast('Add member coming soon', 'info')} style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>
                  + Add
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {members.map(p => (
                <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
                  <Avatar user={p.user} />
                  <div style={{ marginLeft: 12, flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {p.user.display_name} {p.user_id === user?.id ? '(You)' : ''}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.role}</div>
                  </div>
                  {isAdmin && p.user_id !== user?.id && (
                    <button onClick={() => handleRemoveMember(p.user_id)} style={{ color: 'var(--danger)', fontSize: 13, padding: '4px 8px' }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <button 
              onClick={handleLeaveGroup}
              disabled={loading}
              style={{ width: '100%', padding: 12, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 8, backgroundColor: 'var(--bg-tertiary)', fontWeight: 500 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              {loading ? 'Leaving...' : 'Leave Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
