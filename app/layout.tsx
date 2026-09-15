import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agri Route — Fair prices, together',
  description:
    'Smart agricultural marketplace that pools small farmers into truck-scale lots for fair pricing. SIH-26033.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-512.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1B4332',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-paper text-ink antialiased">
          <LanguageProvider>{children}</LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
