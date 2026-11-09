'use client';

import Gallery from '@/components/gallery';
import { RequireAuth } from '@/lib/session';

export default function DashboardPage() {
  return <RequireAuth>{user => <Gallery user={user} />}</RequireAuth>;
}
