import { redirect } from 'next/navigation';
import AuthPage from '@/components/authentication-page';
import { getCurrentUser } from '@/lib/auth';

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/');
  return <AuthPage initialMode="register" />;
}
