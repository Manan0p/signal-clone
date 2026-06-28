import { create } from 'zustand';
import { Message, TypingUser } from '@/types';
import { parseUTCDate } from '@/lib/date';

interface MessageState {
  messagesByConversation: Record<string, Message[]>;
  typingByConversation: Record<string, TypingUser[]>;
  hasPreviousPage: Record<string, boolean>;
  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: Message['status']) => void;
  setTyping: (conversationId: string, user: TypingUser, isTyping: boolean) => void;
  clearTyping: (conversationId: string) => void;
  setHasPreviousPage: (conversationId: string, has: boolean) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messagesByConversation: {},
  typingByConversation: {},
  hasPreviousPage: {},

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    })),

  prependMessages: (conversationId, messages) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...messages, ...existing],
        },
      };
    }),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      // Avoid duplicates
      if (existing.some((m) => m.id === message.id)) return state;
      
      const newMessages = [...existing, message];
      // Keep strictly sorted by created_at
      newMessages.sort((a, b) => parseUTCDate(a.created_at).getTime() - parseUTCDate(b.created_at).getTime());
      
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: newMessages,
        },
      };
    }),

  updateMessageStatus: (conversationId, messageId, status) =>
    set((state) => {
      const msgs = state.messagesByConversation[conversationId] || [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: msgs.map((m) =>
            m.id === messageId ? { ...m, status } : m
          ),
        },
      };
    }),

  setTyping: (conversationId, user, isTyping) =>
    set((state) => {
      const existing = state.typingByConversation[conversationId] || [];
      let updated: TypingUser[];
      if (isTyping) {
        updated = existing.some((u) => u.user_id === user.user_id)
          ? existing
          : [...existing, user];
      } else {
        updated = existing.filter((u) => u.user_id !== user.user_id);
      }
      return {
        typingByConversation: {
          ...state.typingByConversation,
          [conversationId]: updated,
        },
      };
    }),

  clearTyping: (conversationId) =>
    set((state) => ({
      typingByConversation: {
        ...state.typingByConversation,
        [conversationId]: [],
      },
    })),

  setHasPreviousPage: (conversationId, has) =>
    set((state) => ({
      hasPreviousPage: { ...state.hasPreviousPage, [conversationId]: has },
    })),
}));
