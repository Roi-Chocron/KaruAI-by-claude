// The site comes in English (at /) and Hebrew (under /he). Pages pick their copy from per-page dictionaries in
// messages/, typed by the English one so a missing Hebrew string fails the typecheck.

export type Locale = 'en' | 'he';

export const dirOf = (locale: Locale) => (locale === 'he' ? 'rtl' : 'ltr');

// The address of a page in the other language: /pricing <-> /he/pricing
export function localePath(locale: Locale, path: string) {
  const bare = path.replace(/^\/he(?=\/|$)/, '') || '/';
  if (locale === 'en') return bare;
  return bare === '/' ? '/he' : `/he${bare}`;
}

export type Messages<T> = { en: T; he: T };
