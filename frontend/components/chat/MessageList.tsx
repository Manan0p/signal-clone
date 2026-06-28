'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Message, Conversation } from '@/types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useMessageStore } from '@/stores/messageStore';
import { format, isToday, isYesterday } from 'date-fns';
import api from '@/lib/api';
import { parseUTCDate } from '@/lib/date';

interface MessageListProps {
  conversationId: string;
  conversationType: 'direct' | 'group';
  currentUserId: string;
  messages: Message[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onReply?: (message: Message) => void;
}

function formatDateSeparator(dateString: string) {
  const date = parseUTCDate(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export function MessageList({
  conversationId,
  conversationType,
  currentUserId,
  messages,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onReply
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingUsersFromStore = useMessageStore((s) => s.typingByConversation[conversationId]);
  const typingUsers = typingUsersFromStore || [];
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const prevMessagesLength = useRef(messages.length);

  // Send read receipts for unread messages
  useEffect(() => {
    const unreadMessages = messages.filter(m => m.sender_id !== currentUserId && m.status !== 'read');
    if (unreadMessages.length > 0) {
      // Just mark the latest one as read to update the DB marker
      const latest = unreadMessages[unreadMessages.length - 1];
      api.patch(`/api/conversations/${conversationId}/read`, { message_id: latest.id }).catch(() => {});
    }
  }, [messages, conversationId, currentUserId]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Load more when scrolled near top
    if (scrollTop < 100 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
    
    // Auto-scroll logic: if user scrolls up, disable auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current && messages.length > prevMessagesLength.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, shouldAutoScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationId]); // run once per conversation open

  // Group messages for rendering
  const renderMessages = () => {
    const elements: React.ReactNode[] = [];
    
    // Static E2EE privacy notice placeholder mimicking original Signal app
    elements.push(
      <div key="e2e-notice" style={{ display: 'flex', justifyContent: 'center', margin: '16px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4, maxWidth: '80%' }}>
          🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even Signal, can read or listen to them.
        </span>
      </div>
    );

    let lastDateStr = '';

    messages.forEach((msg, index) => {
      const dateStr = formatDateSeparator(msg.created_at);
      
      if (dateStr !== lastDateStr) {
        elements.push(
          <div key={`date-${dateStr}`} style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 16px 0' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {dateStr}
            </span>
          </div>
        );
        lastDateStr = dateStr;
      }

      const isSentByMe = msg.sender_id === currentUserId;
      const isSystem = msg.type === 'system';
      
      const nextMsg = messages[index + 1];
      const prevMsg = messages[index - 1];
      
      // Determine if we show the tail (last message in a consecutive group from same sender)
      const showTail = !nextMsg || nextMsg.sender_id !== msg.sender_id || nextMsg.type === 'system' || (parseUTCDate(nextMsg.created_at).getTime() - parseUTCDate(msg.created_at).getTime() > 5 * 60000);
      
      // Determine if we show sender name in group chats
      const showSenderName = conversationType === 'group' && !isSentByMe && !isSystem && 
        (!prevMsg || prevMsg.sender_id !== msg.sender_id || prevMsg.type === 'system');

      elements.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isSentByMe={isSentByMe}
          showTail={showTail}
          showSenderName={showSenderName}
          onReply={onReply}
        />
      );
    });

    return elements;
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        padding: '16px 0',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {isLoadingMore && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-tertiary)' }}>
          Loading...
        </div>
      )}
      
      {renderMessages()}
      
      {typingUsers.map(tu => (
        <TypingIndicator key={tu.user_id} name={conversationType === 'group' ? tu.display_name : undefined} />
      ))}
    </div>
  );
}
