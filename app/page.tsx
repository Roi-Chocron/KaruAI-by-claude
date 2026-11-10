import type { Metadata } from 'next';
import KaruAIHome from '@/components/karuai-home';
import { SignedInRedirect } from '@/lib/session';

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { en: '/', he: '/he' } },
};

export default function Home() {
  return (
    <>
      <SignedInRedirect />
      <KaruAIHome />
    </>
  );
}
