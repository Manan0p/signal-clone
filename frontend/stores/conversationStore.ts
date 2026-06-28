import { create } from 'zustand';
import { Conversation } from '@/types';
import api from '@/lib/api';
import { parseUTCDate } from '@/lib/date';

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  addOrUpdateConversation: (conv: Conversation) => void;
  updateLastMessage: (conversationId: string, preview: string, at: string) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  updateUserOnlineStatus: (userId: string, isOnline: boolean, lastSeen: string | null) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isLoading: false,

  setActiveConversation: (id) => set({ activeConversationId: id }),

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/api/conversations');
      set({ conversations: res.data as Conversation[], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addOrUpdateConversation: (conv) => {
    set((state) => {
      const idx = state.conversations.findIndex((c) => c.id === conv.id);
      if (idx >= 0) {
        const updated = [...state.conversations];
        updated[idx] = conv;
        return { conversations: updated };
      }
      return { conversations: [conv, ...state.conversations] };
    });
  },

  updateLastMessage: (conversationId, preview, at) => {
    set((state) => {
      const updated = state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, last_message_preview: preview, last_message_at: at }
          : c
      );
      // Re-sort by last_message_at
      updated.sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return parseUTCDate(b.last_message_at).getTime() - parseUTCDate(a.last_message_at).getTime();
      });
      return { conversations: updated };
    });
  },

  incrementUnread: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: c.unread_count + 1 } : c
      ),
    }));
  },

  clearUnread: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    }));
  },

  updateUserOnlineStatus: (userId, isOnline, lastSeen) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => ({
        ...conv,
        participants: conv.participants.map((p) =>
          p.user_id === userId
            ? { ...p, user: { ...p.user, is_online: isOnline, last_seen: lastSeen } }
            : p
        ),
      })),
    }));
  },
}));
