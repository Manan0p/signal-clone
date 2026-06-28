'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ToastProvider } from '@/components/common/Toast';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, initFromStorage } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Initialize auth from storage on mount
  useEffect(() => {
    initFromStorage();
    setMounted(true);
  }, [initFromStorage]);

  // Redirect if not logged in
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [mounted, isLoading, user, router]);

  // Connect WebSocket and listen for events
  useWebSocket();

  if (!mounted || isLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
        Loading Signal...
      </div>
    );
  }

  // Mobile layout detection: if we are on a conversation page, hide sidebar on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isConversationPage = pathname !== '/';

  return (
    <ToastProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* On mobile, show sidebar only if not in a conversation */}
        <div style={{
          display: (!isMobile || !isConversationPage) ? 'block' : 'none',
          flexShrink: 0,
          width: isMobile ? '100%' : 'var(--sidebar-width)',
          height: '100%',
        }}>
          <Sidebar isMobile={isMobile} />
        </div>
        
        {/* On mobile, show main content only if in a conversation */}
        <div style={{
          display: (!isMobile || isConversationPage) ? 'flex' : 'none',
          flex: 1,
          flexDirection: 'column',
          height: '100%',
          minWidth: 0,
        }}>
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
