import { redirect } from 'next/navigation';
import AuthPage from '../authentication_page';
import { getCurrentUser } from '../../karu_auth';

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/');
  return <AuthPage initialMode="register" />;
}
