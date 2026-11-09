'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, CheckCircle2 } from 'lucide-react';

// Sign-in is with Google only: the button sends the browser to the API, which takes it through Google's
// consent screen and back to `next` with a session
const ERRORS: Record<string, string> = {
  cancelled: 'Google sign-in was cancelled.',
  state: 'The sign-in link expired. Please try again.',
  failed: 'Google sign-in failed. Please try again.',
  unverified: 'Your Google account has no verified email address.',
  config: 'Google sign-in is not set up yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).',
  rate: 'Too many sign-in attempts. Please wait a few minutes and try again.',
};

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

export default function AuthPage() {
  const [href, setHref] = useState('/api/auth/google');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next) setHref(`/api/auth/google?next=${encodeURIComponent(next)}`);
    const code = params.get('error');
    if (code) setError(ERRORS[code] ?? ERRORS.failed);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900" dir="ltr">
      
      {/* Left Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 py-12 relative z-10">
        
        {/* Logo (Mobile Top) */}
        <Link href="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">KaruAI</span>
        </Link>

        <div className="max-w-md w-full mx-auto mt-10 lg:mt-0">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Welcome to KaruAI
            </h1>
            <p className="text-slate-500 text-lg">
              Sign in or create your free account with Google.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <a
            href={href}
            className="w-full flex justify-center items-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            <GoogleLogo />
            Continue with Google
          </a>

          <p className="mt-8 text-center text-xs text-slate-500 leading-relaxed">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-700">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Right Brand Section (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden flex-col justify-between p-12">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-40"></div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-blue-600 w-7 h-7" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">KaruAI</span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Turn ideas into visual stories in seconds.
          </h2>
          
          <div className="space-y-5 text-blue-100 mb-12 text-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-300 shrink-0 mt-0.5" />
              <p>AI-powered generation of stunning carousels for social media.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-300 shrink-0 mt-0.5" />
              <p>Fully customizable templates, colors, and typography to match your brand.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-300 shrink-0 mt-0.5" />
              <p>Organize, duplicate, and manage all your creations in one smart workspace.</p>
            </div>
          </div>
        </div>

        {/* Testimonial Placeholder */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl max-w-lg">
          <p className="text-white italic mb-4">
            &quot;KaruAI completely transformed how I create content for LinkedIn. What used to take me 2 hours now takes me 5 minutes.&quot;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center text-blue-800 font-bold">
              SD
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Sarah Davis</p>
              <p className="text-blue-200 text-xs">Content Creator</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}