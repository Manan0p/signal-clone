'use client';
import React from 'react';
import { User } from '@/types';

interface AvatarProps {
  user?: User | null;
  name?: string;
  color?: string;
  imageUrl?: string | null;
  size?: number;
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export function Avatar({ user, name, color, imageUrl, size = 40, showOnline, isOnline, className = '' }: AvatarProps) {
  const displayName = user?.display_name || name || '?';
  const avatarColor = user?.avatar_color || color || '#7986CB';
  const avatarImage = user?.avatar_url || imageUrl;
  const online = isOnline ?? user?.is_online ?? false;
  const initials = getInitials(displayName);
  const fontSize = size * 0.38;

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 600,
          color: '#FFFFFF',
          letterSpacing: '0.5px',
          userSelect: 'none',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {avatarImage ? (
          <img src={avatarImage} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials
        )}
      </div>
      {showOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: '50%',
            backgroundColor: online ? 'var(--online)' : 'var(--text-tertiary)',
            border: '2px solid var(--bg-secondary)',
            transition: 'background-color var(--transition)',
          }}
        />
      )}
    </div>
  );
}
