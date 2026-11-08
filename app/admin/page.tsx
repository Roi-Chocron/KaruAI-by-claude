import { redirect } from 'next/navigation';
import AdminPanel from '@/components/admin-panel';
import { getCurrentUser, publicUser } from '@/lib/auth';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=%2Fadmin');
  if (user.role !== 'admin') redirect('/');
  return <AdminPanel me={publicUser(user)} />;
}
