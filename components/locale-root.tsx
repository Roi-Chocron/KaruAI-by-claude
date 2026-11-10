'use client';

import { useEffect, type ReactNode } from 'react';
import { dirOf, type Locale } from '@/lib/i18n';

// The root layout always renders <html lang="en">; a Hebrew page wraps itself in this so the language and
// direction are right in the static HTML (on the wrapper) and on <html> once the page runs.
export function LocaleRoot({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const before = { lang: html.lang, dir: html.dir };
    html.lang = locale;
    html.dir = dirOf(locale);
    return () => {
      html.lang = before.lang;
      html.dir = before.dir;
    };
  }, [locale]);

  return (
    <div lang={locale} dir={dirOf(locale)}>
      {children}
    </div>
  );
}
