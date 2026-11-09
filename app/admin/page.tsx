'use client';

import AdminPanel from '@/components/admin-panel';
import { RequireAuth } from '@/lib/session';

export default function AdminPage() {
  return <RequireAuth admin>{user => <AdminPanel me={user} />}</RequireAuth>;
}
