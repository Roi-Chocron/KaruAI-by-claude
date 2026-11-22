'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { identifyUser, resetUser } from '@/lib/analytics';
import { localePath } from '@/lib/i18n';
import { useLocale } from '@/lib/locale';
import { appMessages } from '@/messages/app';
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
  const [error, setError] = useState<'loadFailed' | 'suspended' | null>(null);
  const locale = useLocale();
  const t = appMessages[locale].shell;

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async res => {
        if (res.status === 401) {
          window.location.replace(loginUrl());
          return;
        }
        const data = await res.json().catch(() => null);
        if (data?.code === 'suspended') {
          setError('suspended');
          return;
        }
        if (!res.ok || !data?.user) throw new Error(data?.error || `Request failed with status ${res.status}`);
        if (admin && data.user.role !== 'admin') {
          window.location.replace('/dashboard');
          return;
        }
        identifyUser(data.user.id, { email: data.user.email, name: data.user.name });
        setUser(data.user);
      })
      .catch(err => {
        console.error('Checking the sign-in failed:', err);
        setError('loadFailed');
      });
  }, [admin]);

  if (user) return <>{children(user)}</>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-sm text-graphite px-6 text-center">
      {error ? (
        <div role="alert">
          <p>{t[error]}</p>
          {error === 'suspended' && (
            <p className="mt-3 flex flex-wrap justify-center gap-x-4">
              <Link href={localePath(locale, '/contact')} className="inline-flex items-center min-h-10 text-ink underline underline-offset-4">{t.contact}</Link>
              <Link href={localePath(locale, '/cancel')} className="inline-flex items-center min-h-10 text-ink underline underline-offset-4">{t.cancel}</Link>
            </p>
          )}
        </div>
      ) : (
        <span role="status">
          <Loader2 className="animate-spin text-ink" size={28} aria-hidden="true" />
          <span className="sr-only">{t.loading}</span>
        </span>
      )}
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
