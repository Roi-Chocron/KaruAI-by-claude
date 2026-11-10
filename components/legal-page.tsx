import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { dirOf, localePath, type Locale } from '@/lib/i18n';

const COPY = {
  en: { updated: 'Last updated', home: 'Home', otherLanguage: 'עברית' },
  he: {
    updated: 'עודכן לאחרונה',
    home: 'דף הבית',
    otherLanguage: 'English',
    // The Hebrew text is a translation; the English one is the binding version
    translation: 'זהו תרגום לעברית של הנוסח באנגלית. אם יש הבדל בין הנוסחים, הנוסח באנגלית הוא הקובע.',
    original: 'לנוסח באנגלית',
  },
};

// Title, description and the address of the page in the other language
export function legalMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: localePath(locale, path), languages: { en: localePath('en', path), he: localePath('he', path) } },
  };
}

// The frame of the legal pages: header, title and the text column. `path` is the English address of the page.
export function LegalPage({ locale = 'en', path, title, updated, children }: {
  locale?: Locale;
  path: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const other: Locale = locale === 'he' ? 'en' : 'he';
  const Back = locale === 'he' ? ArrowRight : ArrowLeft;
  return (
    <div className="min-h-screen bg-paper text-ink" dir={dirOf(locale)} lang={locale}>
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo href={localePath(locale, '/')} />
          <div className="flex items-center gap-5 text-sm text-graphite">
            <Link href={localePath(other, path)} lang={other} className="hover:text-ink transition-colors">
              {COPY[locale].otherLanguage}
            </Link>
            <Link href={localePath(locale, '/')} className="flex items-center gap-1.5 hover:text-ink transition-colors">
              <Back className="w-4 h-4" />
              {COPY[locale].home}
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        {locale === 'he' && (
          <p className="mb-10 p-4 rounded-xl border border-line bg-mist text-sm text-graphite leading-relaxed">
            {COPY.he.translation}{' '}
            <Link href={localePath('en', path)} className="text-ink underline underline-offset-2">{COPY.he.original}</Link>
          </p>
        )}
        <h1 className="font-display font-bold text-6xl md:text-8xl leading-[0.9]">{title}</h1>
        <p className="mt-4 text-sm text-graphite">{COPY[locale].updated}: {updated}</p>
        <div className="legal mt-12 space-y-10 border-t border-ink pt-10">{children}</div>
      </main>
    </div>
  );
}
