import { redirect } from 'next/navigation';
import AuthForm from '../auth-form';
import { getCurrentUser } from '../../karu_auth';

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/');
  return <AuthForm mode="login" />;
}
