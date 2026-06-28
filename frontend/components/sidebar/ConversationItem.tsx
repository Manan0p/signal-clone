'use client';
import React from 'react';
import { Conversation, User } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { parseUTCDate } from '@/lib/date';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}

function formatTime(dateString: string | null) {
  if (!dateString) return '';
  const date = parseUTCDate(dateString);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'E');
  return format(date, 'MMM d');
}

export function ConversationItem({ conversation, currentUserId, isActive, onClick }: ConversationItemProps) {
  let displayName = conversation.name;
  let avatarColor = conversation.avatar_color;
  let otherUser: User | undefined = undefined;

  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find((p) => p.user_id !== currentUserId);
    otherUser = otherParticipant?.user;
    displayName = otherUser?.display_name || 'Unknown';
    avatarColor = otherUser?.avatar_color;
  }

  const timeStr = formatTime(conversation.last_message_at);
  const isOnline = otherUser?.is_online;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        cursor: 'pointer',
        backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
        transition: 'background-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Avatar
        name={displayName || '?'}
        color={avatarColor || '#7986CB'}
        imageUrl={otherUser?.avatar_url}
        size={48}
        showOnline={conversation.type === 'direct'}
        isOnline={isOnline}
      />
      
      <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 15, fontWeight: isActive || conversation.unread_count > 0 ? 600 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </span>
          <span style={{ fontSize: 12, color: conversation.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)', marginLeft: 8, flexShrink: 0 }}>
            {timeStr}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ 
            fontSize: 14, 
            color: conversation.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: conversation.unread_count > 0 ? 500 : 400,
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            flex: 1
          }}>
            {conversation.last_message_preview || 'No messages yet'}
          </span>
          
          {conversation.unread_count > 0 && (
            <div style={{
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 10,
              marginLeft: 8,
              minWidth: 20,
              textAlign: 'center',
            }}>
              {conversation.unread_count}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
