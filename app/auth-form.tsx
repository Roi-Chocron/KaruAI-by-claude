'use client';

import { useState } from 'react';
import { Bot, Loader2, Lock, Mail, User } from 'lucide-react';

const Field = ({ icon: Icon, ...props }: { icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
    <input
      {...props}
      required
      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
    />
  </div>
);

// Where to go after signing in: the page that sent the user here, if it is one of ours
function nextPath() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister && password !== confirm) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
      window.location.href = nextPath(); // a full load, so every page sees the new session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  const otherPage = isRegister ? '/login' : '/register';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">KaruAI</span>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">{isRegister ? 'Create an account' : 'Welcome back'}</h1>

        <div className="space-y-4">
          {isRegister && <Field icon={User} type="text" placeholder="Full name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} />}
          <Field icon={Mail} type="email" placeholder="Email address" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Field icon={Lock} type="password" placeholder="Password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} />
          {isRegister && <Field icon={Lock} type="password" placeholder="Confirm password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-60"
          >
            {busy && <Loader2 size={18} className="animate-spin" />}
            {isRegister ? 'Sign up' : 'Log in'}
          </button>
        </div>

        <p className="mt-8 text-center text-gray-600 text-sm">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <a href={otherPage} className="text-indigo-600 font-medium hover:underline">
            {isRegister ? 'Log in' : 'Sign up'}
          </a>
        </p>
      </form>
    </div>
  );
}
