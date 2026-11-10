'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { MarkedText } from '@/components/brand/marked-text';
import { Slide } from '@/components/home/example-carousel';
import { LanguageSwitch } from '@/components/language-switch';
import { UserLocaleRoot } from '@/components/locale-root';
import { authMessages } from '@/messages/auth';
import { homeMessages } from '@/messages/home';
import { localePath, type Locale } from '@/lib/i18n';

// Sign-in is with Google only: the button sends the browser to the API, which takes it through Google's
// consent screen and back to `next` with a session

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');

// Local development only (the API refuses it anywhere else): sign in with just an email
function DevLogin({ next }: { next: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok) {
      window.location.href = next;
      return;
    }
    setError(data?.error || 'Could not sign in.');
    setBusy(false);
  };

  return (
    <form onSubmit={submit} dir="ltr" lang="en" className="mt-10 p-4 rounded-xl border border-dashed border-graphite bg-mist">
      <p className="text-xs font-semibold mb-2">Dev login (local development only)</p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email"
          className="flex-1 min-w-0 border border-line rounded-lg px-3 py-2 text-sm bg-paper focus:outline-none focus:border-ink"
        />
        <button type="submit" disabled={busy} className="btn-primary !py-2 !px-4 text-sm disabled:opacity-60">
          Sign in
        </button>
      </div>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </form>
  );
}

function SignIn({ locale }: { locale: Locale }) {
  const t = authMessages[locale];
  const [next, setNext] = useState('/dashboard');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [devLogin, setDevLogin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeNext(params.get('next')));
    setErrorCode(params.get('error'));
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => setDevLogin(data?.devLogin === true))
      .catch(() => undefined);
  }, []);

  const href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  const error = errorCode ? t.errors[errorCode] ?? t.errors.failed : null;
  const example = homeMessages[locale].example;

  return (
    <div className="min-h-screen bg-paper text-ink grid lg:grid-cols-2">
      <div className="flex flex-col px-6 sm:px-12 lg:px-16 py-8">
        <div className="flex items-center justify-between">
          <Logo href={localePath(locale, '/')} />
          <LanguageSwitch locale={locale} />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto lg:mx-0 py-16">
          <h1 className="font-display font-bold text-6xl sm:text-7xl leading-[0.9]">{t.title}</h1>
          <p className="mt-4 text-lg text-graphite">{t.sub}</p>

          {error && (
            <div role="alert" className="mt-8 p-4 rounded-xl border border-red-700 text-red-700 text-sm">
              {error}
            </div>
          )}

          <a href={href} className="btn mt-8 w-full border border-ink bg-paper text-ink hover:bg-mist py-3.5">
            <GoogleLogo />
            {t.google}
          </a>

          <p className="mt-6 text-sm text-graphite leading-relaxed">
            {t.agree.before}
            <Link href="/terms" className="text-ink underline underline-offset-2">{t.agree.terms}</Link>
            {t.agree.and}
            <Link href="/privacy" className="text-ink underline underline-offset-2">{t.agree.privacy}</Link>
            {t.agree.after}
          </p>

          {devLogin && <DevLogin next={next} />}
        </div>
      </div>

      {/* The other half: what you get, as three slides of the landing page's sample carousel */}
      <div className="hidden lg:flex flex-col bg-ink text-paper p-12 xl:p-16 overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        <h2 className="font-display font-bold text-6xl xl:text-7xl leading-[0.9]">
          <MarkedText text={t.panelTitle} />
        </h2>
        <div aria-hidden="true" className="relative flex-1 min-h-[16rem] my-10">
          <Slide className="absolute w-44 xl:w-52 top-[12%] start-0 -rotate-6 bg-mist text-ink">
            <span className="font-display font-bold text-[22cqw] leading-none" dir="ltr">02</span>
            <span className="mt-auto font-display font-bold text-[13cqw] leading-[0.92]">{example.items[1].title}</span>
          </Slide>
          <Slide className="absolute w-44 xl:w-52 top-[6%] start-[9rem] xl:start-[10.5rem] rotate-2 bg-lime text-ink">
            <span className="font-display font-bold text-[22cqw] leading-none" dir="ltr">01</span>
            <span className="mt-auto font-display font-bold text-[13cqw] leading-[0.92]">{example.items[0].title}</span>
          </Slide>
          <Slide className="absolute w-44 xl:w-52 top-0 start-[18rem] xl:start-[21rem] rotate-[8deg] bg-paper text-ink">
            <span className="mt-auto font-display font-bold text-[13cqw] leading-[0.9]">{example.cover}</span>
            <span className="mt-[7cqw] h-[1.4cqw] w-[16cqw] bg-ink" />
          </Slide>
        </div>
        <p className="text-paper/70">{t.panelNote}</p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return <UserLocaleRoot>{locale => <SignIn locale={locale} />}</UserLocaleRoot>;
}
