import type { Metadata } from 'next';
import './globals.css';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { SITE_URL } from '@/lib/site';
import { fontVariables } from '@/lib/fonts';

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

// Polar sends buyers back to /billing with a token that opens their customer portal (customer_session_token). It is
// taken out of the address before any other script runs, so error reports and analytics never record it.
const DROP_PORTAL_TOKEN = `(function(){try{var u=new URL(location.href);if(u.searchParams.has('customer_session_token')){u.searchParams.delete('customer_session_token');history.replaceState(history.state,'',u.pathname+u.search+u.hash)}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DROP_PORTAL_TOKEN }} />
      </head>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
