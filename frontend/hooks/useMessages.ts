'use client';
import { useCallback, useState } from 'react';
import api from '@/lib/api';
import { useMessageStore } from '@/stores/messageStore';
import { Message } from '@/types';

export function useMessages(conversationId: string) {
  const { messagesByConversation, hasPreviousPage, setMessages, prependMessages, setHasPreviousPage } =
    useMessageStore();
  const messages = messagesByConversation[conversationId] || [];
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/api/conversations/${conversationId}/messages`);
      const msgs = res.data as Message[];
      setMessages(conversationId, msgs);
      setHasPreviousPage(conversationId, msgs.length === 30);
    } catch {
      // ignore
    }
  }, [conversationId, setMessages, setHasPreviousPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasPreviousPage[conversationId]) return;
    const oldest = messages[0];
    if (!oldest) return;
    setIsLoadingMore(true);
    try {
      const res = await api.get(
        `/api/conversations/${conversationId}/messages?cursor=${oldest.id}&limit=30`
      );
      const older = res.data as Message[];
      prependMessages(conversationId, older);
      setHasPreviousPage(conversationId, older.length === 30);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore, messages, hasPreviousPage, prependMessages, setHasPreviousPage]);

  return { messages, fetchMessages, loadMore, isLoadingMore, hasMore: !!hasPreviousPage[conversationId] };
}
