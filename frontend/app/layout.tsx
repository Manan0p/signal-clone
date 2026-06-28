import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Clone — Secure Messaging',
  description: 'A production-quality Signal Messenger clone with end-to-end encrypted messaging, group chats, and real-time communication.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
