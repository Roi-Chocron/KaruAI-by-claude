'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { setConsent, useConsent } from '@/lib/consent';

const COPY = {
  en: {
    text: 'We use essential cookies to keep you signed in. With your consent we also use analytics cookies to understand how KaruAI is used and improve it.',
    policy: 'Cookie Policy',
    essential: 'Essential only',
    all: 'Accept all',
    label: 'Cookie consent',
  },
  he: {
    text: 'אנחנו משתמשים בעוגיות חיוניות כדי שתישארו מחוברים. בהסכמתכם נשתמש גם בעוגיות סטטיסטיקה כדי להבין איך משתמשים ב־KaruAI ולשפר אותו.',
    policy: 'מדיניות עוגיות',
    essential: 'רק חיוניות',
    all: 'אישור הכל',
    label: 'הסכמה לעוגיות',
  },
};

export function CookieBanner() {
  const consent = useConsent();
  const locale = /^\/he(\/|$)/.test(usePathname() ?? '') ? 'he' : 'en';
  if (consent !== null) return null;
  const t = COPY[locale];
  return (
    <div
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-6 sm:max-w-md z-[100] bg-paper border border-ink rounded-2xl p-5 text-sm text-ink"
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      lang={locale}
      role="dialog"
      aria-label={t.label}
    >
      <p className="mb-4 leading-relaxed">
        {t.text} <Link href="/cookies" className="font-semibold underline underline-offset-2">{t.policy}</Link>
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setConsent('essential')} className="btn-secondary !py-2 !px-4 text-sm">{t.essential}</button>
        <button onClick={() => setConsent('all')} className="btn-primary !py-2 !px-4 text-sm">{t.all}</button>
      </div>
    </div>
  );
}

// Lets visitors change their mind (on the Cookie Policy page)
export function CookieSettingsButton() {
  return (
    <button onClick={() => setConsent(null)} className="btn-secondary !py-2 !px-4 text-sm">
      Change cookie settings
    </button>
  );
}
