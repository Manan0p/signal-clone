// All TypeScript interfaces for the Signal Clone app

export interface User {
  id: string;
  phone_number: string;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_url?: string | null;
  about: string;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}

export interface Participant {
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user: User;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatar_color: string | null;
  created_by: string | null;
  created_at: string;
  last_message_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  participants: Participant[];
}

export interface ReplyInfo {
  id: string;
  content: string;
  sender_display_name: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  type: 'text' | 'system';
  status: MessageStatus;
  reply_to_id: string | null;
  attachment_url?: string | null;
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
  sender: User | null;
  reply_to: ReplyInfo | null;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

// WebSocket event types
export type WSEventType =
  | 'message.new'
  | 'message.status'
  | 'typing.indicator'
  | 'user.online'
  | 'pong';

export interface WSMessageNew {
  type: 'message.new';
  message: Message;
  conversation_id: string;
}

export interface WSMessageStatus {
  type: 'message.status';
  message_id: string;
  status: MessageStatus;
  conversation_id: string;
}

export interface WSTypingIndicator {
  type: 'typing.indicator';
  conversation_id: string;
  user_id: string;
  display_name?: string;
  is_typing: boolean;
}

export interface WSUserOnline {
  type: 'user.online';
  user_id: string;
  is_online: boolean;
  last_seen: string | null;
}

export interface WSPong {
  type: 'pong';
}

export type WSEvent =
  | WSMessageNew
  | WSMessageStatus
  | WSTypingIndicator
  | WSUserOnline
  | WSPong;

export interface TypingUser {
  user_id: string;
  display_name: string;
}

export const SIGNAL_AVATAR_COLORS = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#7986CB',
  '#4FC3F7',
  '#4DB6AC',
  '#81C784',
  '#FFD54F',
  '#FF8A65',
  '#4CAF50',
];

export const COUNTRY_CODES = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
];
