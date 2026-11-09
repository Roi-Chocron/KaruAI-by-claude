'use client';

import React, { useEffect, Suspense } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/nextjs';
import { initPostHog } from '@/lib/analytics';
import { useConsent } from '@/lib/consent';
import { CookieBanner } from '@/components/cookie-banner';

const isProd = process.env.NODE_ENV === 'production';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

// Analytics and session replay load only after the visitor accepts them in the cookie banner
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const consent = useConsent();
  const allowed = consent === 'all';

  useEffect(() => {
    if (!allowed) return;
    initPostHog();
    if (!Sentry.getClient()?.getIntegrationByName('Replay')) Sentry.addIntegration(Sentry.replayIntegration());
  }, [allowed]);

  return (
    <>
      {/* PostHog Next.js Route Change Tracker wrapped in Suspense */}
      <Suspense fallback={null}>
        <PostHogPageViewTracker />
      </Suspense>

      {/* Google Analytics 4 (GA4) - Strictly loaded ONLY in Production */}
      {allowed && isProd && GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Microsoft Clarity - Strictly loaded ONLY in Production */}
      {allowed && isProd && CLARITY_PROJECT_ID && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}
        </Script>
      )}

      {children}
      <CookieBanner />
    </>
  );
}
