'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { setConsent, useConsent } from '@/lib/consent';
import { useLocale } from '@/lib/locale';
import { dirOf, localePath, type Locale } from '@/lib/i18n';
import { systemMessages } from '@/messages/system';

const FIXED_ENGLISH = new Set(['/', '/terms', '/privacy', '/cookies', '/refund', '/accessibility']);

const button = 'min-h-11 !py-2 !px-4 text-sm flex-1 sm:flex-none';

export function CookieBanner() {
  const consent = useConsent();
  // The landing and legal pages have a fixed language; the others follow the visitor's choice
  const pathname = usePathname() ?? '';
  const userLocale = useLocale();
  const locale: Locale = /^\/he(\/|$)/.test(pathname) ? 'he' : FIXED_ENGLISH.has(pathname) ? 'en' : userLocale;
  if (consent !== null) return null;
  const t = systemMessages[locale].cookies;
  // Sticky at the end of the page rather than fixed: it floats over the bottom of the screen while scrolling,
  // and at the end of the page it sits below the content, so it never hides a button for good
  return (
    <div
      className="sticky bottom-0 z-[100] flex justify-end px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
      dir={dirOf(locale)}
      lang={locale}
    >
      <section
        aria-label={t.label}
        className="pointer-events-auto w-full sm:max-w-md bg-paper border border-ink rounded-2xl p-4 sm:p-5 text-sm text-ink shadow-[0_8px_30px_rgba(10,10,10,0.12)]"
      >
        <p className="mb-4 leading-relaxed">
          {t.text}{' '}
          <Link href={localePath(locale, '/cookies')} className="font-semibold underline underline-offset-2">
            {t.policy}
          </Link>
        </p>
        <div className="flex gap-2 sm:justify-end">
          <button type="button" onClick={() => setConsent('essential')} className={`btn-secondary ${button}`}>
            {t.essential}
          </button>
          <button type="button" onClick={() => setConsent('all')} className={`btn-primary ${button}`}>
            {t.all}
          </button>
        </div>
      </section>
    </div>
  );
}

// Lets visitors change their mind (on the Cookie Policy page)
export function CookieSettingsButton({ locale = 'en' }: { locale?: Locale }) {
  return (
    <button type="button" onClick={() => setConsent(null)} className="btn-secondary min-h-11 !py-2 !px-4 text-sm">
      {systemMessages[locale].cookies.change}
    </button>
  );
}
