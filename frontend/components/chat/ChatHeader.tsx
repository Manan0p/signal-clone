'use client';
import React, { useState } from 'react';
import { Conversation, User } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { GroupInfoModal } from '@/components/modals/GroupInfoModal';
import { ContactInfoModal } from '@/components/modals/ContactInfoModal';
import { useToast } from '@/components/common/Toast';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
}

function formatLastSeen(dateString: string | null) {
  if (!dateString) return 'Offline';
  // simple relative time could be implemented here, simplified for now
  return 'Last seen recently';
}

export function ChatHeader({ conversation, currentUserId, onBack }: ChatHeaderProps) {
  const { showToast } = useToast();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  let displayName = conversation.name;
  let avatarColor = conversation.avatar_color;
  let subtitle = '';
  let otherUser: User | undefined = undefined;

  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find((p) => p.user_id !== currentUserId);
    otherUser = otherParticipant?.user;
    displayName = otherUser?.display_name || 'Unknown';
    avatarColor = otherUser?.avatar_color;
    subtitle = otherUser?.is_online ? 'online' : formatLastSeen(otherUser?.last_seen || null);
  } else {
    subtitle = `${conversation.participants.length} members`;
  }

  const handleVideoCall = () => showToast('Video calling coming soon', 'info');
  const handleAudioCall = () => showToast('Audio calling coming soon', 'info');

  const handleHeaderClick = () => {
    if (conversation.type === 'group') {
      setShowGroupInfo(true);
    } else if (conversation.type === 'direct') {
      setShowContactInfo(true);
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{ marginRight: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', backgroundColor: 'transparent' }} className="hover:bg-[var(--bg-hover)] transition-colors" title="Close chat">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
        
        <div 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
          onClick={handleHeaderClick}
        >
          <Avatar
            name={displayName || '?'}
            color={avatarColor || '#7986CB'}
            imageUrl={otherUser?.avatar_url}
            size={40}
            showOnline={conversation.type === 'direct'}
            isOnline={otherUser?.is_online}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{displayName}</span>
            <span style={{ fontSize: 13, color: otherUser?.is_online ? 'var(--online)' : 'var(--text-secondary)' }}>
              {subtitle}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)' }}>
        <button onClick={handleVideoCall} title="Video Call">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
        <button onClick={handleAudioCall} title="Audio Call">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
        <button title="More options">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {showGroupInfo && (
        <GroupInfoModal conversation={conversation} onClose={() => setShowGroupInfo(false)} />
      )}
      
      {showContactInfo && otherUser && (
        <ContactInfoModal user={otherUser} onClose={() => setShowContactInfo(false)} />
      )}
    </div>
  );
}
