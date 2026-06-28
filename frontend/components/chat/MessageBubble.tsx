'use client';
import React from 'react';
import { Message } from '@/types';
import { DeliveryStatus } from './DeliveryStatus';
import { format } from 'date-fns';
import { useState } from 'react';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { parseUTCDate } from '@/lib/date';

interface MessageBubbleProps {
  message: Message;
  isSentByMe: boolean;
  showTail: boolean;
  showSenderName: boolean;
  onReply?: (message: Message) => void;
}

export function MessageBubble({ message, isSentByMe, showTail, showSenderName, onReply }: MessageBubbleProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (message.type === 'system') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          padding: '6px 12px',
          borderRadius: 16,
          textAlign: 'center',
          maxWidth: '80%'
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  const timeStr = format(parseUTCDate(message.created_at), 'HH:mm');

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSentByMe ? 'flex-end' : 'flex-start',
        margin: '2px 16px',
        marginBottom: showTail ? 8 : 2,
        width: 'calc(100% - 32px)',
      }}
    >
      {showSenderName && !isSentByMe && message.sender && (
        <span style={{ fontSize: 13, color: message.sender.avatar_color || 'var(--text-secondary)', marginLeft: 12, marginBottom: 4, fontWeight: 500 }}>
          {message.sender.display_name}
        </span>
      )}
      
      <div style={{
        display: 'flex',
        flexDirection: isSentByMe ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 8,
        maxWidth: '100%',
        width: '100%',
      }}>
        <div className={`relative ${isSentByMe ? (showTail ? 'bubble-tail-right' : '') : (showTail ? 'bubble-tail-left' : '')}`} style={{
          maxWidth: '75%',
          backgroundColor: isSentByMe ? 'var(--bg-message-sent)' : 'var(--bg-message-received)',
          color: isSentByMe ? '#FFFFFF' : 'var(--text-primary)',
          padding: '8px 12px',
          borderRadius: 16,
          borderBottomRightRadius: isSentByMe && showTail ? 4 : 16,
          borderBottomLeftRadius: !isSentByMe && showTail ? 4 : 16,
          wordBreak: 'break-word',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {message.reply_to && (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${isSentByMe ? '#FFFFFF' : 'var(--accent)'}`,
              padding: '4px 8px',
              borderRadius: 4,
              marginBottom: 6,
              fontSize: 13,
              opacity: 0.9,
            }}>
              <div style={{ fontWeight: 600, color: isSentByMe ? '#FFFFFF' : 'var(--accent)', marginBottom: 2 }}>
                {message.reply_to.sender_display_name}
              </div>
              <div className="truncate">{message.reply_to.content}</div>
            </div>
          )}
          
          {message.attachment_url && (
            <>
              <div 
                style={{ marginBottom: message.content ? 8 : 0, borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setShowImageModal(true)}
              >
                <img 
                  src={message.attachment_url} 
                  alt="Attachment" 
                  style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', display: 'block', borderRadius: 8 }} 
                />
              </div>
              {showImageModal && (
                <ImageViewerModal
                  imageUrl={message.attachment_url}
                  senderName={isSentByMe ? 'You' : (message.sender?.display_name || 'Unknown')}
                  timestamp={timeStr}
                  onClose={() => setShowImageModal(false)}
                />
              )}
            </>
          )}
          
          {message.content && (
            <span style={{ fontSize: 15, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
              {message.content}
            </span>
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            marginTop: 2,
            opacity: 0.8,
          }}>
            <span style={{ fontSize: 11, color: isSentByMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
              {timeStr}
            </span>
            {isSentByMe && <DeliveryStatus status={message.status} inBubble={true} />}
          </div>
        </div>

        {/* Hover reply button */}
        {onReply && (
          <button
            onClick={() => onReply(message)}
            style={{
              opacity: isHovered ? 1 : 0,
              visibility: isHovered ? 'visible' : 'hidden',
              transition: 'opacity 150ms ease, visibility 150ms ease',
              color: 'var(--text-secondary)',
              padding: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            title="Reply"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
