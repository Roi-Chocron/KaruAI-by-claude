import Gallery from '@/components/gallery';
import KaruAIHome from '@/components/karuai-home';
import { getCurrentUser, publicUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    return <KaruAIHome />;
  }
  return <Gallery user={publicUser(user)} />;
}
