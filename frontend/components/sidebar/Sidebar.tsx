'use client';
import React, { useState } from 'react';
import { SidebarHeader } from './SidebarHeader';
import { ConversationList } from './ConversationList';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { NewConversationModal } from '@/components/modals/NewConversationModal';

interface SidebarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isMobile, onCloseMobile }: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: isMobile ? '100%' : 'var(--sidebar-width)',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      borderRight: isMobile ? 'none' : '1px solid var(--divider)',
      position: 'relative',
    }}>
      <SidebarHeader 
        onOpenSettings={() => setShowSettings(true)} 
        onNewConversation={() => setShowNewConv(true)} 
      />
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <ConversationList onCloseMobile={onCloseMobile} />
      </div>

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
      
      {showNewConv && (
        <NewConversationModal onClose={() => setShowNewConv(false)} />
      )}
    </div>
  );
}
