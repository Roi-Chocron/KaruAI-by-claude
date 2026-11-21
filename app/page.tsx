import type { Metadata } from 'next';
import KaruAIHome from '@/components/karuai-home';
import { LocaleRoot } from '@/components/locale-root';
import { SignedInRedirect } from '@/lib/session';
import { homeMessages } from '@/messages/home';

const t = homeMessages.en.meta;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  alternates: { canonical: '/', languages: { en: '/', he: '/he' } },
  openGraph: { title: t.title, description: t.description, url: '/', locale: 'en_US', images: ['/og.png'] },
};

export default function Home() {
  return (
    <LocaleRoot locale="en" remember>
      <SignedInRedirect />
      <KaruAIHome />
    </LocaleRoot>
  );
}
