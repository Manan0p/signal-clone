'use client';
import { useEffect } from 'react';
import { wsManager } from '@/lib/websocket';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useMessageStore } from '@/stores/messageStore';
import { WSEvent } from '@/types';

export function useWebSocket() {
  const user = useAuthStore((s) => s.user);
  const { updateLastMessage, incrementUnread, clearUnread, updateUserOnlineStatus, activeConversationId, fetchConversations } =
    useConversationStore();
  const { addMessage, updateMessageStatus, setTyping } = useMessageStore();

  useEffect(() => {
    const unsubscribe = wsManager.subscribe((event: WSEvent) => {
      switch (event.type) {
        case 'message.new': {
          addMessage(event.conversation_id, event.message);
          
          // Check if conversation exists in store, if not, fetch it
          const { conversations } = useConversationStore.getState();
          const exists = conversations.some(c => c.id === event.conversation_id);
          
          if (!exists) {
            fetchConversations();
          } else {
            let preview = event.message.content;
            if (!preview) {
              preview = event.message.attachment_url ? '[Attachment]' : '';
            } else if (preview.length > 80) {
              preview = preview.substring(0, 77) + '...';
            }
            
            updateLastMessage(
              event.conversation_id,
              preview,
              event.message.created_at
            );
            // If not in this conversation, increment unread
            if (event.conversation_id !== activeConversationId) {
              incrementUnread(event.conversation_id);
            }
          }
          break;
        }
        case 'message.status': {
          updateMessageStatus(event.conversation_id, event.message_id, event.status);
          break;
        }
        case 'typing.indicator': {
          setTyping(
            event.conversation_id,
            {
              user_id: event.user_id,
              display_name: event.display_name || 'Someone',
            },
            event.is_typing
          );
          break;
        }
        case 'user.online': {
          updateUserOnlineStatus(event.user_id, event.is_online, event.last_seen);
          break;
        }
        case 'system.connected' as any: {
          fetchConversations();
          break;
        }
        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, activeConversationId, addMessage, updateLastMessage, incrementUnread, updateUserOnlineStatus, updateMessageStatus, setTyping, fetchConversations]);
}
