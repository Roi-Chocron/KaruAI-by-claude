import type { Metadata } from 'next';
import './globals.css';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { SITE_URL } from '@/lib/site';

const description = 'Describe your idea and KaruAI designs a ready-to-post Instagram carousel you can fine-tune in a full editor.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'KaruAI - AI Instagram carousel generator',
  description,
  openGraph: {
    type: 'website',
    siteName: 'KaruAI',
    title: 'KaruAI - AI Instagram carousel generator',
    description,
    url: '/',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'KaruAI - AI Instagram carousel generator' }],
  },
  twitter: { card: 'summary_large_image', title: 'KaruAI', description, images: ['/og.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
