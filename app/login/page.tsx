import { redirect } from 'next/navigation';
import AuthPage from '../authentication_page';
import { getCurrentUser } from '../../karu_auth';

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/');
  return <AuthPage initialMode="login" />;
}
