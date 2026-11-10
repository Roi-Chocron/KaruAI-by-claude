import type { Metadata } from 'next';
import KaruAIHome from '@/components/karuai-home';
import { LocaleRoot } from '@/components/locale-root';
import { SignedInRedirect } from '@/lib/session';
import { homeMessages } from '@/messages/home';

const t = homeMessages.he.meta;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  alternates: { canonical: '/he', languages: { en: '/', he: '/he' } },
  openGraph: { title: t.title, description: t.description, url: '/he', locale: 'he_IL', images: ['/og.png'] },
};

export default function HebrewHome() {
  return (
    <LocaleRoot locale="he" remember>
      <SignedInRedirect />
      <KaruAIHome locale="he" />
    </LocaleRoot>
  );
}
