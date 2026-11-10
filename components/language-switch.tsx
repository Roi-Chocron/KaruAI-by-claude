'use client';

import type { Locale } from '@/lib/i18n';
import { storeLocale } from '@/lib/locale';

// Switches the language of the pages that serve both from one address
export function LanguageSwitch({ locale, className = '' }: { locale: Locale; className?: string }) {
  const other: Locale = locale === 'he' ? 'en' : 'he';
  return (
    <button type="button" onClick={() => storeLocale(other)} lang={other} className={`text-sm text-graphite hover:text-ink transition-colors ${className}`}>
      {other === 'he' ? 'עברית' : 'English'}
    </button>
  );
}
