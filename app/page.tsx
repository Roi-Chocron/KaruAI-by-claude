import KaruAIHome from '@/components/karuai-home';
import { SignedInRedirect } from '@/lib/session';

export default function Home() {
  return (
    <>
      <SignedInRedirect />
      <KaruAIHome />
    </>
  );
}
