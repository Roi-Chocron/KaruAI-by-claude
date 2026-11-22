'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { authMessages } from '@/messages/auth';
import type { Locale } from '@/lib/i18n';
import { detectInAppBrowser, type InAppBrowser } from '@/shared/in-app-browser';

// The app's built-in browser this page runs in, if any (only known after the page runs)
export function useInAppBrowser(): InAppBrowser | null {
  const [browser, setBrowser] = useState<InAppBrowser | null>(null);
  useEffect(() => setBrowser(detectInAppBrowser(navigator.userAgent)), []);
  return browser;
}

// An Android link that opens this page in Chrome (or, without a package, lets the user pick a browser)
function intentUrl(href: string, chrome: boolean) {
  const url = new URL(href);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;${chrome ? 'package=com.android.chrome;' : ''}`
    + `S.browser_fallback_url=${encodeURIComponent(href)};end`;
}

// The sign-in page inside Instagram, Facebook, TikTok and the like: Google refuses to sign in there, so this shows
// how to open the page in the phone's real browser (keeping where to go after signing in), with a way to try anyway
export function InAppEscape({ locale, browser, tryAnywayHref }: { locale: Locale; browser: InAppBrowser; tryAnywayHref: string }) {
  const t = authMessages[locale].inApp;
  const [copied, setCopied] = useState(false);
  const app = t.apps[browser.app] ?? t.apps.webview;

  useEffect(() => trackEvent('inapp_browser_seen', browser), [browser]);
  const escaped = (how: string) => trackEvent('inapp_escape_clicked', { ...browser, how });

  const copy = async () => {
    const href = window.location.href;
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      // Older in-app browsers: copy from a selected, hidden field
      const field = document.createElement('textarea');
      field.value = href;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
    escaped('copy');
  };

  const href = typeof window === 'undefined' ? '' : window.location.href;
  return (
    <section aria-labelledby="inapp-title" className="mt-8 rounded-xl bg-lime text-ink p-5">
      <h2 id="inapp-title" className="font-semibold text-lg">{t.title}</h2>
      <p className="mt-2 text-sm">{t.body(app)}</p>
      {browser.os === 'android' ? (
        <div className="mt-4 grid gap-2">
          <a href={intentUrl(href, true)} onClick={() => escaped('chrome')} className="btn bg-ink text-paper hover:bg-ink/90 py-3">
            <ExternalLink size={16} aria-hidden="true" /> {t.openChrome}
          </a>
          <a href={intentUrl(href, false)} onClick={() => escaped('browser')} className="btn border border-ink bg-paper text-ink py-3">
            {t.openOther}
          </a>
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium">{t.iosSteps[browser.app] ?? t.iosSteps.webview}</p>
      )}
      <button type="button" onClick={copy} className="btn border border-ink bg-paper text-ink w-full mt-2 py-3">
        <LinkIcon size={16} aria-hidden="true" /> {t.copy}
      </button>
      <p role="status" className="mt-2 text-sm empty:hidden">{copied ? t.copied : ''}</p>
      <a href={tryAnywayHref} onClick={() => escaped('anyway')} className="inline-flex items-center min-h-10 mt-2 text-sm underline underline-offset-4">
        {t.tryAnyway}
      </a>
    </section>
  );
}
