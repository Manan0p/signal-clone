'use client';
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useMessages } from '@/hooks/useMessages';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import api from '@/lib/api';
import { Conversation, Message } from '@/types';

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { setActiveConversation, addOrUpdateConversation, conversations } = useConversationStore();
  
  const resolvedParams = use(params);
  const conversationId = resolvedParams.conversationId;
  
  const storeConv = conversations.find(c => c.id === conversationId);
  const [localConv, setLocalConv] = useState<Conversation | null>(null);
  const conversation = storeConv || localConv;
  
  const [loading, setLoading] = useState(!storeConv);
  const [error, setError] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const { messages, fetchMessages, loadMore, isLoadingMore, hasMore } = useMessages(conversationId);

  useEffect(() => {
    setActiveConversation(conversationId);
    setReplyingTo(null);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    const fetchConv = async () => {
      try {
        const res = await api.get(`/api/conversations/${conversationId}`);
        addOrUpdateConversation(res.data);
        if (!storeConv) {
          setLocalConv(res.data);
        }
        fetchMessages();
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (!storeConv) {
      fetchConv();
    } else {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleBackMobile = () => {
    router.push('/');
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>Loading chat...</div>;
  }

  if (error || !conversation || !user) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>Conversation not found or access denied</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      <ChatHeader 
        conversation={conversation} 
        currentUserId={user.id} 
        onBack={handleBackMobile} 
      />
      
      <MessageList
        conversationId={conversationId}
        conversationType={conversation.type}
        currentUserId={user.id}
        messages={messages}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onReply={setReplyingTo}
      />
      
      <MessageInput 
        conversationId={conversationId} 
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
