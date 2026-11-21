'use client';

import type { Locale } from '@/lib/i18n';
import { storeLocale } from '@/lib/locale';

// Switches the language of the pages that serve both from one address. The negative margin keeps the text where
// it was while the padding gives it a finger-sized target.
export function LanguageSwitch({ locale, className = '' }: { locale: Locale; className?: string }) {
  const other: Locale = locale === 'he' ? 'en' : 'he';
  return (
    <button
      type="button"
      onClick={() => storeLocale(other)}
      lang={other}
      className={`inline-flex items-center min-h-10 px-2 -mx-2 rounded-lg text-sm text-graphite hover:text-ink transition-colors ${className}`}
    >
      {other === 'he' ? 'עברית' : 'English'}
    </button>
  );
}
