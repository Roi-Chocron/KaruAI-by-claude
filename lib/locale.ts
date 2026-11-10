'use client';

import { useSyncExternalStore } from 'react';
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n';

const EVENT = 'karu-locale';

export function getStoredLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find(part => part.startsWith(`${LOCALE_COOKIE}=`))?.split('=')[1];
  return value === 'en' || value === 'he' ? value : null;
}

export function storeLocale(locale: Locale) {
  if (getStoredLocale() === locale) return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`;
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
};

// The visitor's language on pages that serve both: what they chose last, else the browser's, else English.
// The static HTML is English; the page switches right after it loads.
export function useLocale(): Locale {
  return useSyncExternalStore(
    subscribe,
    () => getStoredLocale() ?? (navigator.language.toLowerCase().startsWith('he') ? 'he' : 'en'),
    () => 'en',
  );
}
