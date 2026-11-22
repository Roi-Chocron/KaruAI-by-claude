import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { BusinessDetailsLine } from '@/components/business';
import { LocaleRoot } from '@/components/locale-root';
import { dirOf, localePath, type Locale } from '@/lib/i18n';

const PAGES = ['/terms', '/privacy', '/cookies', '/refund', '/accessibility', '/contact', '/cancel'] as const;

const COPY = {
  en: {
    updated: 'Last updated',
    home: 'Home',
    otherLanguage: 'עברית',
    legalNav: 'Legal pages',
    pages: { '/terms': 'Terms of Service', '/privacy': 'Privacy Policy', '/cookies': 'Cookie Policy', '/refund': 'Refund Policy', '/accessibility': 'Accessibility Statement', '/contact': 'Contact us', '/cancel': 'Cancel subscription' },
  },
  he: {
    updated: 'עודכן לאחרונה',
    home: 'דף הבית',
    otherLanguage: 'English',
    legalNav: 'מסמכים משפטיים',
    pages: { '/terms': 'תנאי שימוש', '/privacy': 'מדיניות פרטיות', '/cookies': 'מדיניות עוגיות', '/refund': 'מדיניות ביטולים', '/accessibility': 'הצהרת נגישות', '/contact': 'צור קשר', '/cancel': 'ביטול עסקה' },
    // The Hebrew text is a translation; the English one is the binding version
    translation: 'זהו תרגום לעברית של הנוסח באנגלית. אם יש הבדל בין הנוסחים, הנוסח באנגלית הוא הקובע.',
    original: 'לנוסח באנגלית',
  },
};

// Title, description and the address of the page in the other language. `path` is the English address.
export function legalMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const url = localePath(locale, path);
  return {
    title,
    description,
    alternates: { canonical: url, languages: { en: localePath('en', path), he: localePath('he', path) } },
    openGraph: { title, description, url, locale: locale === 'he' ? 'he_IL' : 'en_US', images: ['/og.png'] },
  };
}

const navLink = 'inline-flex items-center min-h-10 px-2 rounded-md hover:text-ink transition-colors';

// The frame of the legal pages: header, title, the text column and links to the other legal pages.
// `path` is the English address of the page. `translated` shows the note (Hebrew only) that the English text binds.
export function LegalPage({ locale = 'en', path, title, updated, translated = true, children }: {
  locale?: Locale;
  path: (typeof PAGES)[number];
  title: string;
  updated: ReactNode;
  translated?: boolean;
  children: ReactNode;
}) {
  const t = COPY[locale];
  const other: Locale = locale === 'he' ? 'en' : 'he';
  const Back = locale === 'he' ? ArrowRight : ArrowLeft;
  return (
    <LocaleRoot locale={locale} remember>
      <div className="min-h-screen bg-paper text-ink" dir={dirOf(locale)} lang={locale}>
        <header className="border-b border-line">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <Logo href={localePath(locale, '/')} className="min-h-10" />
            <nav className="flex items-center gap-1 sm:gap-3 -me-2 text-sm text-graphite">
              <Link href={localePath(other, path)} lang={other} hrefLang={other} className={navLink}>
                {t.otherLanguage}
              </Link>
              <Link href={localePath(locale, '/')} className={`${navLink} gap-1.5`}>
                <Back className="w-4 h-4" aria-hidden="true" />
                {t.home}
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          {locale === 'he' && translated && (
            <p className="mb-10 p-4 rounded-xl border border-line bg-mist text-sm text-graphite leading-relaxed">
              {COPY.he.translation}{' '}
              <Link href={localePath('en', path)} lang="en" hrefLang="en" className="text-ink underline underline-offset-2">
                {COPY.he.original}
              </Link>
            </p>
          )}
          <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-8xl leading-[0.9] break-words">{title}</h1>
          <p className="mt-4 text-sm text-graphite">{t.updated}: {updated}</p>
          <div className="legal mt-12 space-y-10 border-t border-ink pt-10 [&_section>*+*]:mt-4">{children}</div>
        </main>
        <footer className="border-t border-line">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
            <BusinessDetailsLine locale={locale} />
          </div>
          <nav aria-label={t.legalNav} className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <ul className="flex flex-wrap gap-x-2 gap-y-1 -ms-2 text-sm text-graphite">
              {PAGES.map(page => (
                <li key={page}>
                  <Link
                    href={localePath(locale, page)}
                    aria-current={page === path ? 'page' : undefined}
                    className={`${navLink} aria-[current=page]:text-ink aria-[current=page]:font-semibold`}
                  >
                    {t.pages[page]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </footer>
      </div>
    </LocaleRoot>
  );
}

// A table on a legal page. On a phone it scrolls inside its own box, so the page itself never scrolls sideways;
// the box is focusable and named so keyboard and screen reader users can reach and scroll it.
export function LegalTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-paper" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full min-w-[34rem] text-start text-xs text-graphite [&_th]:p-2.5 [&_th]:text-start [&_th]:align-bottom [&_td]:p-2.5 [&_td]:align-top">
        {children}
      </table>
    </div>
  );
}

// Text still to be filled in before launch (defined with the business details)
export { Placeholder } from '@/components/business';
