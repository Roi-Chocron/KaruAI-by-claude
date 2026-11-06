import { redirect } from 'next/navigation';
import Gallery from './gallery';
import { getCurrentUser, publicUser } from '../karu_auth';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <Gallery user={publicUser(user)} />;
}
