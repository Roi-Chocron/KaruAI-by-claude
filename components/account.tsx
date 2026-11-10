'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Download, Loader2, LogOut } from 'lucide-react';
import { resetUser } from '@/lib/analytics';
import { AppShell, Avatar, PageHeading } from '@/components/app-shell';
import { fetchAccount, UsageMeter, type AccountSummary } from '@/components/billing';
import { appMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
import type { PublicUser } from '@/types';

const card = 'rounded-2xl border border-line p-6 sm:p-8';
const heading = 'font-display font-bold text-4xl leading-none mb-6';
const field = 'w-full border border-line rounded-[10px] px-3.5 py-3 bg-paper focus:outline-none focus:border-ink';

function AccountPage({ user, locale }: { user: PublicUser; locale: Locale }) {
  const t = appMessages[locale].account;
  const tb = appMessages[locale].billing;
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAccount()
      .then(data => { setAccount(data); setName(data.user.name); })
      .catch(err => setError(err instanceof Error ? err.message : t.loadFailed));
  }, [t.loadFailed]);

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
      alert(err instanceof Error ? err.message : t.saveFailed);
    }
  };

  const logOutEverywhere = async () => {
    if (!confirm(t.confirmLogOutAll)) return;
    await send('/api/account/logout-all', { method: 'POST' }).catch(() => undefined);
    resetUser();
    window.location.href = '/';
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirm(t.confirmDelete)) return;
    setDeleting(true);
    try {
      await send('/api/account', { method: 'DELETE', body: JSON.stringify({ confirmEmail }) });
      resetUser();
      window.location.href = '/';
    } catch (err) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : t.deleteFailed);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeading title={t.title} />

      {error && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{error}</p>}
      {!account ? (
        !error && <div className="flex items-center gap-2 text-sm text-graphite"><Loader2 size={16} className="animate-spin" /> {appMessages[locale].shell.loading}</div>
      ) : (
        <div className="space-y-4">
          <section className={card}>
            <h2 className={heading}>{t.profile}</h2>
            <div className="flex items-center gap-4 mb-6">
              <Avatar user={user} size={56} />
              <div className="min-w-0">
                <p className="text-sm text-graphite">{t.signedInAs}</p>
                <p className="font-medium truncate">{account.user.email}</p>
              </div>
            </div>
            <form onSubmit={saveName} className="flex gap-2 items-end">
              <label className="flex-1">
                <span className="block text-sm font-medium mb-2">{t.name}</span>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setNameStatus('idle'); }}
                  maxLength={100}
                  dir="auto"
                  className={field}
                />
              </label>
              <button type="submit" disabled={!name.trim() || nameStatus === 'saving'} className="btn-primary disabled:opacity-50">
                {nameStatus === 'saved' ? <><Check size={16} /> {t.saved}</> : t.save}
              </button>
            </form>
          </section>

          <section className={card}>
            <div className="flex justify-between items-start gap-4 mb-6">
              <h2 className={`${heading} !mb-0`}>{t.plan(account.plan.name)}</h2>
              <Link href="/billing" className="text-sm font-semibold underline underline-offset-4 whitespace-nowrap">{t.managePlan}</Link>
            </div>
            <div className="space-y-5">
              <UsageMeter label={t.thisMonth(tb.carousels)} used={account.usage.carousels} limit={account.plan.limits.carouselsPerMonth} unlimited={tb.unlimited} />
              <UsageMeter label={t.thisMonth(tb.messages)} used={account.usage.messages} limit={account.plan.limits.aiMessagesPerMonth} unlimited={tb.unlimited} />
              <UsageMeter label={t.thisMonth(tb.images)} used={account.usage.images} limit={account.plan.limits.aiImagesPerMonth} unlimited={tb.unlimited} />
            </div>
          </section>

          <section className={card}>
            <h2 className={heading}>{t.data}</h2>
            <div className="flex flex-wrap gap-3">
              <a href="/api/account/export" className="btn-secondary text-sm">
                <Download size={16} /> {t.download}
              </a>
              <button onClick={logOutEverywhere} className="btn-secondary text-sm">
                <LogOut size={16} className="rtl:-scale-x-100" /> {t.logOutAll}
              </button>
            </div>
            <p className="text-sm text-graphite mt-4">{t.downloadNote(account.carouselCount)}</p>
          </section>

          <section className={`${card} !border-red-700`}>
            <h2 className={`${heading} text-red-700`}>{t.deleteTitle}</h2>
            <p className="text-graphite mb-5">{t.deleteBody(account.carouselCount)}</p>
            <form onSubmit={deleteAccount} className="flex flex-col sm:flex-row gap-2">
              <input
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
                placeholder={t.confirmPlaceholder(account.user.email)}
                aria-label={t.confirmPlaceholder(account.user.email)}
                dir="auto"
                className={`${field} flex-1 text-sm focus:!border-red-700`}
              />
              <button
                type="submit"
                disabled={deleting || confirmEmail.trim().toLowerCase() !== account.user.email}
                className="btn bg-red-700 text-paper hover:bg-red-800 disabled:opacity-40"
              >
                {deleting ? t.deleting : t.deleteButton}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default function Account({ user }: { user: PublicUser }) {
  return <AppShell user={user} active="account">{locale => <AccountPage user={user} locale={locale} />}</AppShell>;
}
