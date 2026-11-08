import Gallery from './gallery';
import KaruAIHome from './karuai-home';
import { getCurrentUser, publicUser } from '../karu_auth';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    return <KaruAIHome />;
  }
  return <Gallery user={publicUser(user)} />;
}
