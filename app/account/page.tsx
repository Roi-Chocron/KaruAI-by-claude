'use client';

import AccountPage from '@/components/account';
import { RequireAuth } from '@/lib/session';

export default function AccountRoute() {
  return <RequireAuth>{user => <AccountPage user={user} />}</RequireAuth>;
}
