'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { MarkedText } from '@/components/brand/marked-text';
import { LocaleRoot } from '@/components/locale-root';
import { localePath, type Locale } from '@/lib/i18n';
import { useLocale } from '@/lib/locale';
import { looksSignedIn } from '@/lib/session';
import { useTabTitle } from '@/lib/tab-title';
import { systemMessages } from '@/messages/system';

const noSubscribe = () => () => {};

// In production this is the static out/404.html, served at whatever address was missing, so it reads the
// address and the sign-in hint in the browser. The static HTML is the English, signed-out version.
export function NotFoundPage() {
  const userLocale = useLocale();
  const underHebrew = useSyncExternalStore(noSubscribe, () => /^\/he(\/|$)/.test(window.location.pathname), () => false);
  const signedIn = useSyncExternalStore(noSubscribe, looksSignedIn, () => false);
  const locale: Locale = underHebrew ? 'he' : userLocale;
  const t = systemMessages[locale].notFound;

  useTabTitle(t.tabTitle);

  const home = signedIn ? '/dashboard' : localePath(locale, '/');
  return (
    <LocaleRoot locale={locale} remember={underHebrew}>
      <div className="min-h-screen bg-paper text-ink flex flex-col">
        <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Logo href={home} />
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col justify-center">
          <p className="font-display font-bold text-xl sm:text-2xl text-graphite">{t.code}</p>
          <h1 className="mt-2 font-display font-bold text-[clamp(3.25rem,11vw,10rem)] leading-[0.92] break-words">
            <MarkedText text={t.title} />
          </h1>
          <p className="mt-6 text-lg text-graphite max-w-md">{t.body}</p>
          <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {signedIn ? (
              <>
                <Link href="/dashboard" className="btn-primary">{t.carousels}</Link>
                <Link href="/account" className="btn-secondary">{t.account}</Link>
              </>
            ) : (
              <>
                <Link href={localePath(locale, '/')} className="btn-primary">{t.home}</Link>
                <Link href="/login" className="btn-secondary">{t.logIn}</Link>
              </>
            )}
          </div>
        </main>
      </div>
    </LocaleRoot>
  );
}
