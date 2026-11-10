'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { identifyUser, resetUser } from '@/lib/analytics';
import type { PublicUser } from '@/types';

// The pages are static files, so they learn who is signed in from the API (the session cookie is HttpOnly).

export const SIGNED_IN_COOKIE = 'karu_signed_in';

// A readable hint cookie the API sets next to the session; it only says that someone was signed in
export const looksSignedIn = () => typeof document !== 'undefined' && document.cookie.split('; ').includes(`${SIGNED_IN_COOKIE}=1`);

export function loginUrl() {
  const here = window.location.pathname + window.location.search;
  return `/login?next=${encodeURIComponent(here)}`;
}

export async function logOut() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
  resetUser();
  window.location.href = '/';
}

// Renders `children` with the signed-in user; sends visitors who are not signed in (or not admins, with
// `admin`) away. The API checks every request again, so this only decides what the page shows.
export function RequireAuth({ children, admin = false }: { children: (user: PublicUser) => ReactNode; admin?: boolean }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async res => {
        if (res.status === 401) {
          window.location.replace(loginUrl());
          return;
        }
        const data = await res.json().catch(() => null);
        if (data?.code === 'suspended') throw new Error(data.error);
        if (!res.ok || !data?.user) throw new Error(data?.error || `Request failed with status ${res.status}`);
        if (admin && data.user.role !== 'admin') {
          window.location.replace('/dashboard');
          return;
        }
        identifyUser(data.user.id, { email: data.user.email, name: data.user.name });
        setUser(data.user);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not reach the server.'));
  }, [admin]);

  if (user) return <>{children(user)}</>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-sm text-graphite px-6 text-center">
      {error ?? <Loader2 className="animate-spin text-ink" size={28} />}
    </div>
  );
}

// On the landing page: signed-in visitors go straight to their carousels
export function SignedInRedirect() {
  useEffect(() => {
    if (looksSignedIn()) window.location.replace('/dashboard');
  }, []);
  return null;
}
