'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2, LogOut, Trash2, UserRound } from 'lucide-react';
import { resetUser } from '@/lib/analytics';
import { fetchAccount, UsageMeter, type AccountSummary } from '@/components/billing';

const card = 'bg-white rounded-2xl border border-slate-200 shadow-sm p-6';

export default function AccountPage() {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAccount()
      .then(data => { setAccount(data); setName(data.user.name); })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load your account.'));
  }, []);

  const send = async (url: string, init: RequestInit) => {
    const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
    return data;
  };

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setNameStatus('saving');
    try {
      await send('/api/account', { method: 'PATCH', body: JSON.stringify({ name }) });
      setNameStatus('saved');
    } catch (err) {
      setNameStatus('idle');
      alert(err instanceof Error ? err.message : 'Could not save the name.');
    }
  };

  const logOutEverywhere = async () => {
    if (!confirm('Sign out on every device, this one included?')) return;
    await send('/api/account/logout-all', { method: 'POST' }).catch(() => undefined);
    resetUser();
    window.location.href = '/';
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirm('Delete your account and all your carousels for good? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await send('/api/account', { method: 'DELETE', body: JSON.stringify({ confirmEmail }) });
      resetUser();
      window.location.href = '/';
    } catch (err) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : 'Could not delete the account.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans" dir="ltr">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">{error}</p>}
        {!account ? (
          !error && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : (
          <>
            <section className={card}>
              <h2 className="flex items-center gap-2 font-semibold mb-4"><UserRound size={18} /> Profile</h2>
              <div className="flex items-center gap-4 mb-5">
                {account.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={account.user.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-full" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">
                    {(account.user.name || account.user.email)[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Signed in with Google as</p>
                  <p className="font-medium">{account.user.email}</p>
                </div>
              </div>
              <form onSubmit={saveName} className="flex gap-2 items-end">
                <label className="flex-1">
                  <span className="block text-sm font-medium text-slate-700 mb-1.5">Name</span>
                  <input
                    value={name}
                    onChange={e => { setName(e.target.value); setNameStatus('idle'); }}
                    maxLength={100}
                    dir="auto"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <button type="submit" disabled={!name.trim() || nameStatus === 'saving'} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50">
                  {nameStatus === 'saved' ? 'Saved' : 'Save'}
                </button>
              </form>
            </section>

            <section className={card}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Plan: {account.plan.name}</h2>
                <Link href="/billing" className="text-sm font-semibold text-blue-600 hover:underline">Billing & plans</Link>
              </div>
              <div className="space-y-4">
                <UsageMeter label="New carousels this month" used={account.usage.carousels} limit={account.plan.limits.carouselsPerMonth} />
                <UsageMeter label="AI design messages this month" used={account.usage.messages} limit={account.plan.limits.aiMessagesPerMonth} />
                <UsageMeter label="AI images this month" used={account.usage.images} limit={account.plan.limits.aiImagesPerMonth} />
              </div>
            </section>

            <section className={card}>
              <h2 className="font-semibold mb-4">Your data</h2>
              <div className="flex flex-wrap gap-3">
                <a href="/api/account/export" className="inline-flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
                  <Download size={16} /> Download my data
                </a>
                <button onClick={logOutEverywhere} className="inline-flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
                  <LogOut size={16} /> Sign out everywhere
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">The download is a JSON file with your account, usage and every carousel ({account.carouselCount}).</p>
            </section>

            <section className={`${card} border-red-200`}>
              <h2 className="flex items-center gap-2 font-semibold text-red-700 mb-2"><Trash2 size={18} /> Delete account</h2>
              <p className="text-sm text-slate-600 mb-4">
                Deletes your account, all {account.carouselCount} carousels and their images. This cannot be undone.
              </p>
              <form onSubmit={deleteAccount} className="flex flex-col sm:flex-row gap-2">
                <input
                  value={confirmEmail}
                  onChange={e => setConfirmEmail(e.target.value)}
                  placeholder={`Type ${account.user.email} to confirm`}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  type="submit"
                  disabled={deleting || confirmEmail.trim().toLowerCase() !== account.user.email}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-40"
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
