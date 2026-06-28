'use client';
import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useToast } from '@/components/common/Toast';
import { wsManager } from '@/lib/websocket';
import { Message } from '@/types';

interface MessageInputProps {
  conversationId: string;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export function MessageInput({ conversationId, replyingTo, onCancelReply }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      wsManager.send({ type: 'typing.start', conversation_id: conversationId });
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      wsManager.send({ type: 'typing.stop', conversation_id: conversationId });
      typingTimeoutRef.current = null;
    }, 3000);
  };
  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && !attachment) return;
    
    wsManager.send({
      type: 'message.send',
      conversation_id: conversationId,
      content: trimmed,
      attachment: attachment || undefined,
      reply_to_id: replyingTo?.id || undefined,
    });
    
    setContent('');
    setAttachment(null);
    setShowEmoji(false);
    if (onCancelReply) onCancelReply();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      wsManager.send({ type: 'typing.stop', conversation_id: conversationId });
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiObj: any) => {
    setContent((prev) => prev + emojiObj.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('File size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachment(reader.result);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 16px',
      backgroundColor: 'var(--bg-primary)',
      position: 'relative',
      width: '100%',
    }}>
      {/* Reply Preview Bar */}
      {replyingTo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-tertiary)',
          padding: '8px 12px',
          borderRadius: 8,
          marginBottom: 8,
          borderLeft: '4px solid var(--accent)',
          fontSize: 13,
          width: '100%',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
              Replying to {replyingTo.sender?.display_name || 'User'}
            </span>
            <span className="truncate" style={{ color: 'var(--text-secondary)' }}>
              {replyingTo.content || (replyingTo.attachment_url ? '[Image]' : '')}
            </span>
          </div>
          <button 
            onClick={onCancelReply} 
            style={{ color: 'var(--text-secondary)', marginLeft: 8 }}
            className="hover:text-[var(--text-primary)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}

      {/* Input controls row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        position: 'relative',
        width: '100%',
      }}>
        {showEmoji && (
          <div style={{ position: 'absolute', bottom: '100%', left: 16, marginBottom: 8, zIndex: 50 }}>
            <EmojiPicker theme={Theme.AUTO} onEmojiClick={onEmojiClick} lazyLoadEmojis />
          </div>
        )}
        
        {attachment && (
          <div style={{ position: 'absolute', bottom: '100%', left: 16, marginBottom: 12, padding: 8, backgroundColor: 'var(--bg-input)', borderRadius: 12, boxShadow: 'var(--shadow-md)', zIndex: 40, border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <img src={attachment} alt="Attachment preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
              <button 
                onClick={() => setAttachment(null)}
                style={{ position: 'absolute', top: -8, right: -8, backgroundColor: 'var(--bg-primary)', borderRadius: '50%', padding: 4, boxShadow: 'var(--shadow-sm)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          backgroundColor: 'var(--bg-input)',
          borderRadius: 24,
          padding: '8px 16px',
        }}>
          <button 
            onClick={() => setShowEmoji(!showEmoji)}
            style={{ padding: 4, marginRight: 8, color: 'var(--text-tertiary)' }}
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
          
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: 4, marginRight: 8, color: 'var(--text-tertiary)' }}
            className="hover:text-[var(--text-primary)] transition-colors"
            title="Attach image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            style={{
              flex: 1,
              maxHeight: 120,
              resize: 'none',
              padding: '4px 0',
              lineHeight: 1.4,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
            rows={1}
          />
          
          {(content.trim() || attachment) && (
            <button 
              onClick={handleSend}
              style={{ 
                padding: 6, 
                marginLeft: 8, 
                backgroundColor: 'var(--accent)', 
                color: '#fff', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
