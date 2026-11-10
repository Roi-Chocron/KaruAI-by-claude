'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { MarkedText, type Marked } from '@/components/brand/marked-text';
import { UserLocaleRoot } from '@/components/locale-root';
import { localePath } from '@/lib/i18n';

const COPY: Record<'en' | 'he', { title: Marked; body: string; home: string; carousels: string }> = {
  en: {
    title: { before: "This slide\ndoesn't ", marked: 'exist.', after: '' },
    body: 'The link may be broken, or the page has moved.',
    home: 'Home',
    carousels: 'My carousels',
  },
  he: {
    title: { before: 'השקף הזה\nלא ', marked: 'קיים.', after: '' },
    body: 'אולי הקישור שבור, ואולי הדף עבר למקום אחר.',
    home: 'לדף הבית',
    carousels: 'הקרוסלות שלי',
  },
};

export function NotFoundPage() {
  return (
    <UserLocaleRoot>
      {locale => {
        const t = COPY[locale];
        return (
          <div className="min-h-screen bg-paper text-ink flex flex-col">
            <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
              <Logo href={localePath(locale, '/')} />
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center">
              <p className="font-display font-bold text-2xl text-graphite" dir="ltr">404</p>
              <h1 className="mt-2 font-display font-bold text-[clamp(4rem,11vw,10rem)] leading-[0.88]">
                <MarkedText text={t.title} />
              </h1>
              <p className="mt-6 text-lg text-graphite max-w-md">{t.body}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/dashboard" className="btn-primary">{t.carousels}</Link>
                <Link href={localePath(locale, '/')} className="btn-secondary">{t.home}</Link>
              </div>
            </main>
          </div>
        );
      }}
    </UserLocaleRoot>
  );
}
