'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useConversationStore } from '@/stores/conversationStore';
import { useAuthStore } from '@/stores/authStore';
import { ConversationItem } from './ConversationItem';
import { SearchBar } from './SearchBar';

interface ConversationListProps {
  onCloseMobile?: () => void;
}

export function ConversationList({ onCloseMobile }: ConversationListProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { conversations, activeConversationId, fetchConversations, clearUnread } = useConversationStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const lowerQ = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      if (c.name && c.name.toLowerCase().includes(lowerQ)) return true;
      if (c.type === 'direct' && user) {
        const other = c.participants.find((p) => p.user_id !== user.id)?.user;
        if (other && other.display_name.toLowerCase().includes(lowerQ)) return true;
      }
      return false;
    });
  }, [conversations, searchQuery, user]);

  const handleSelect = (id: string) => {
    clearUnread(id);
    router.push(`/${id}`);
    if (onCloseMobile) onCloseMobile();
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredConversations.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No conversations found
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUserId={user.id}
              isActive={activeConversationId === conv.id}
              onClick={() => handleSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
