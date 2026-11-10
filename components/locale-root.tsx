'use client';

import { useEffect, type ReactNode } from 'react';
import { dirOf, type Locale } from '@/lib/i18n';
import { storeLocale, useLocale } from '@/lib/locale';

// The root layout always renders <html lang="en">. Pages wrap themselves in this so the language and direction
// are right on the wrapper (in the static HTML when the locale is fixed) and on <html> once the page runs.
export function LocaleRoot({ locale, remember = false, children }: { locale: Locale; remember?: boolean; children: ReactNode }) {
  useEffect(() => {
    if (remember) storeLocale(locale);
    const html = document.documentElement;
    const before = { lang: html.lang, dir: html.dir };
    html.lang = locale;
    html.dir = dirOf(locale);
    return () => {
      html.lang = before.lang;
      html.dir = before.dir;
    };
  }, [locale, remember]);

  return (
    <div lang={locale} dir={dirOf(locale)}>
      {children}
    </div>
  );
}

// For pages with one address for both languages (sign-in, the app): follows the remembered choice
export function UserLocaleRoot({ children }: { children: (locale: Locale) => ReactNode }) {
  const locale = useLocale();
  return <LocaleRoot locale={locale}>{children(locale)}</LocaleRoot>;
}
