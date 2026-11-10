import type { Metadata } from 'next';
import KaruAIHome from '@/components/karuai-home';
import { LocaleRoot } from '@/components/locale-root';
import { SignedInRedirect } from '@/lib/session';

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { en: '/', he: '/he' } },
};

export default function Home() {
  return (
    <LocaleRoot locale="en" remember>
      <SignedInRedirect />
      <KaruAIHome />
    </LocaleRoot>
  );
}
