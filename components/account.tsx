'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Download, Loader2, LogOut } from 'lucide-react';
import { resetUser } from '@/lib/analytics';
import { AppShell, Avatar, PageHeading } from '@/components/app-shell';
import { fetchAccount, UsageMeter, type AccountSummary } from '@/components/billing';
import { appMessages } from '@/messages/app';
import { localePath, type Locale } from '@/lib/i18n';
import { RequireAuth } from '@/lib/session';
import { PLANS, type PaidPlanId } from '@/shared/plans';
import type { PublicUser } from '@/types';

const card = 'rounded-2xl border border-line p-6 sm:p-8';
const heading = 'font-display font-bold text-4xl leading-none mb-6';
const field = 'w-full border border-line rounded-[10px] px-3.5 py-3 bg-paper focus:outline-none focus:border-ink';

// The worker answers in English; the messages it can send this page are shown in the visitor's language
type ServerMessage = 'nameInvalid' | 'confirmMismatch' | 'onlyAdmin' | 'hasSubscription' | 'polarUnavailable';
const serverMessages: ServerMessage[] = ['nameInvalid', 'confirmMismatch', 'onlyAdmin', 'hasSubscription', 'polarUnavailable'];
type ErrorMessage = ServerMessage | 'saveFailed' | 'deleteFailed';

class RequestError extends Error {
  constructor(readonly key: ServerMessage) {
    super(key);
  }
}

const errorOf = (err: unknown, fallback: ErrorMessage): ErrorMessage => (err instanceof RequestError ? err.key : fallback);

function AccountPage({ user, locale }: { user: PublicUser; locale: Locale }) {
  const t = appMessages[locale].account;
  const tb = appMessages[locale].billing;
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [error, setError] = useState(false);
  const [name, setName] = useState('');
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [nameError, setNameError] = useState<ErrorMessage>('saveFailed');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ErrorMessage | null>(null);

  // A subscription that renews: deleting the account ends it now and refunds the unused days, so the box says so
  const [renewing, setRenewing] = useState<{ plan: string; date: string } | null>(null);

  useEffect(() => {
    fetchAccount()
      .then(data => { setAccount(data); setName(data.user.name); })
      .catch(() => setError(true));
    fetch('/api/billing')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const sub = data?.subscription;
        if (sub?.active && !sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
          setRenewing({ plan: PLANS[sub.plan as PaidPlanId].name, date: new Date(sub.currentPeriodEnd).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB', { dateStyle: 'long' }) });
        }
      })
      .catch(() => undefined);
  }, [locale]);

  const send = async (url: string, init: RequestInit) => {
    const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const known = serverMessages.find(key => appMessages.en.account[key] === data?.error);
      throw known ? new RequestError(known) : new Error();
    }
    return data;
  };

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setNameStatus('saving');
    try {
      await send('/api/account', { method: 'PATCH', body: JSON.stringify({ name }) });
      setNameStatus('saved');
    } catch (err) {
      setNameStatus('failed');
      setNameError(errorOf(err, 'saveFailed'));
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
    setDeleteError(null);
    try {
      await send('/api/account', { method: 'DELETE', body: JSON.stringify({ confirmEmail }) });
      resetUser();
      window.location.href = '/';
    } catch (err) {
      setDeleting(false);
      setDeleteError(errorOf(err, 'deleteFailed'));
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeading title={t.title} />

      {error && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{t.loadFailed}</p>}
      {!account ? (
        !error && <div role="status" className="flex items-center gap-2 text-sm text-graphite"><Loader2 size={16} className="animate-spin" /> {appMessages[locale].shell.loading}</div>
      ) : (
        <div className="space-y-4">
          <section className={card}>
            <h2 className={heading}>{t.profile}</h2>
            <div className="flex items-center gap-4 mb-6">
              <Avatar user={user} size={56} />
              <div className="min-w-0">
                <p className="text-sm text-graphite">{t.signedInAs}</p>
                <p className="font-medium truncate"><bdi dir="ltr">{account.user.email}</bdi></p>
              </div>
            </div>
            <form onSubmit={saveName} className="flex gap-2 items-end">
              <label className="flex-1 min-w-0">
                <span className="block text-sm font-medium mb-2">{t.name}</span>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setNameStatus('idle'); }}
                  maxLength={100}
                  aria-invalid={nameStatus === 'failed' || undefined}
                  aria-describedby="name-status"
                  dir="auto"
                  className={field}
                />
              </label>
              <button type="submit" disabled={!name.trim() || nameStatus === 'saving'} className="btn-primary disabled:opacity-50">
                {nameStatus === 'saved' ? <><Check size={16} aria-hidden /> {t.saved}</> : t.save}
              </button>
            </form>
            <p id="name-status" role="status" className={`text-sm empty:hidden mt-3 ${nameStatus === 'failed' ? 'text-red-700' : 'text-graphite'}`}>
              {nameStatus === 'saved' ? t.nameSaved : nameStatus === 'failed' ? t[nameError] : ''}
            </p>
          </section>

          <section className={card}>
            <div className="flex justify-between items-start gap-4 mb-6">
              <h2 className={`${heading} !mb-0 min-w-0 break-words`}>{t.plan(account.plan.name)}</h2>
              <Link href="/billing" className="inline-flex items-center min-h-10 -my-2 text-sm font-semibold underline underline-offset-4 whitespace-nowrap">{t.managePlan}</Link>
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
                <Download size={16} aria-hidden /> {t.download}
              </a>
              <button onClick={logOutEverywhere} className="btn-secondary text-sm">
                <LogOut size={16} aria-hidden className="rtl:-scale-x-100" /> {t.logOutAll}
              </button>
            </div>
            <p className="text-sm text-graphite mt-4">{t.downloadNote(account.carouselCount)}</p>
          </section>

          <section className={`${card} !border-red-700`}>
            <h2 className={`${heading} text-red-700`}>{t.deleteTitle}</h2>
            <p className="text-graphite mb-5">{t.deleteBody(account.carouselCount)}</p>
            {renewing && (
              <p className="text-graphite -mt-2 mb-5">
                {t.deleteSubscription(`\u2068${renewing.plan}\u2069`, renewing.date)}{' '}
                <Link href={localePath(locale, '/refund')} className="underline underline-offset-4 hover:text-ink">{t.refundPolicy}</Link>
              </p>
            )}
            <form onSubmit={deleteAccount} className="flex flex-col sm:flex-row gap-2">
              <input
                value={confirmEmail}
                onChange={e => { setConfirmEmail(e.target.value); setDeleteError(null); }}
                placeholder={t.confirmPlaceholder(account.user.email)}
                aria-label={t.confirmLabel(account.user.email)}
                aria-invalid={deleteError ? true : undefined}
                aria-describedby="delete-error"
                type="email"
                autoComplete="off"
                spellCheck={false}
                // An email is typed left to right; while empty the field follows the page so the placeholder reads right
                dir={confirmEmail ? 'ltr' : undefined}
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
            <p id="delete-error" role="alert" className="text-sm text-red-700 mt-3 empty:hidden">{deleteError && t[deleteError]}</p>
          </section>
        </div>
      )}
    </main>
  );
}

export function ProtectedAccountPage() {
  return (
    <RequireAuth>
      {user => <AppShell user={user} active="account">{locale => <AccountPage user={user} locale={locale} />}</AppShell>}
    </RequireAuth>
  );
}
