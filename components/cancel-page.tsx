'use client';

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { BusinessValue, EmailLink, PhoneLink } from '@/components/business';
import { cancelMessages } from '@/messages/cancel';
import { localePath, type Locale } from '@/lib/i18n';
import { looksSignedIn } from '@/lib/session';
import { BUSINESS } from '@/shared/business';
import { PLANS, type PaidPlanId } from '@/shared/plans';

type Subscription = { plan: PaidPlanId; status: string; active: boolean; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean };
type Mode = 'period_end' | 'now' | 'undo';

const REASONS = ['other', 'too_expensive', 'unused', 'missing_features', 'low_quality', 'too_complex', 'switched_service', 'customer_service'] as const;

// Polar's customer portal for this organization, where cancelling also works (NEXT_PUBLIC_POLAR_PORTAL_URL)
const PORTAL_URL = process.env.NEXT_PUBLIC_POLAR_PORTAL_URL || null;

const intlLocale = (locale: Locale) => (locale === 'he' ? 'he-IL' : 'en-GB');
const field = 'w-full border border-line rounded-[10px] px-3.5 py-3 bg-paper focus:outline-none focus:border-ink';

// /cancel: a signed-in subscriber cancels here; anyone else (signed out, suspended, or paying under another account)
// sends a request, and every other way to cancel is listed. The law asks for all of these (Consumer Protection Law 14ט).
export function CancelSubscription({ locale }: { locale: Locale }) {
  const t = cancelMessages[locale];
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('other');
  const [busy, setBusy] = useState<Mode | null>(null);
  const [result, setResult] = useState<{ text: string; reference: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const longDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(intlLocale(locale), { dateStyle: 'long' }) : '');

  useEffect(() => {
    if (!looksSignedIn()) {
      setSubscription(null);
      return;
    }
    fetch('/api/billing/sync', { method: 'POST' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => setSubscription(data?.subscription?.active ? data.subscription : null))
      .catch(() => setSubscription(null));
  }, []);

  const cancel = async (mode: Mode) => {
    if (mode === 'now' && !window.confirm(t.confirmNow)) return;
    setBusy(mode);
    setFailed(false);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, reason }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.reference) throw new Error(data?.error);
      const amount = data.refunded
        ? new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'ILS' }).format(data.refunded / 100)
        : null;
      const text = mode === 'undo'
        ? t.doneUndo
        : mode === 'now'
          ? [t.doneNow, amount && t.doneRefund(amount)].filter(Boolean).join(' ')
          : t.doneEnds(longDate(data.subscription?.currentPeriodEnd ?? null));
      setResult({ text, reference: data.reference });
      setSubscription(data.subscription?.active ? data.subscription : null);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-10">
      <p>{t.intro}</p>

      <div aria-live="polite" className="empty:hidden space-y-3">
        {result && (
          <div role="status" className="rounded-xl bg-lime text-ink p-4 text-sm">
            <p className="font-semibold">{result.text}</p>
            <p className="mt-1">{t.reference(result.reference)}</p>
          </div>
        )}
        {failed && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{t.failed}</p>}
      </div>

      {subscription === undefined ? (
        <p role="status" className="flex items-center gap-2 text-sm text-graphite">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {t.loading}
        </p>
      ) : subscription ? (
        <section className="rounded-2xl border border-ink p-6 space-y-4">
          <h2 className="!mt-0">{t.yourPlan(PLANS[subscription.plan].name)}</h2>
          <p>{subscription.cancelAtPeriodEnd ? t.ends(longDate(subscription.currentPeriodEnd)) : t.renews(longDate(subscription.currentPeriodEnd))}</p>
          {subscription.cancelAtPeriodEnd ? (
            <button type="button" onClick={() => cancel('undo')} disabled={busy !== null} className="btn-secondary disabled:opacity-60">
              {busy === 'undo' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {busy === 'undo' ? t.working : t.undo}
            </button>
          ) : (
            <>
              <label className="block text-sm">
                <span className="block font-medium mb-1.5">{t.reasonLabel}</span>
                <select value={reason} onChange={event => setReason(event.target.value as typeof reason)} className={field}>
                  {REASONS.map(key => <option key={key} value={key}>{t.reasons[key]}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <button type="button" onClick={() => cancel('period_end')} disabled={busy !== null} className="btn-secondary w-full disabled:opacity-60">
                    {busy === 'period_end' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {busy === 'period_end' ? t.working : t.atPeriodEnd}
                  </button>
                  <p className="mt-2 text-sm text-graphite">{t.atPeriodEndHelp(longDate(subscription.currentPeriodEnd))}</p>
                </div>
                <div>
                  <button type="button" onClick={() => cancel('now')} disabled={busy !== null} className="btn w-full border border-red-700 text-red-700 hover:bg-red-50 disabled:opacity-60">
                    {busy === 'now' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {busy === 'now' ? t.working : t.now}
                  </button>
                  <p className="mt-2 text-sm text-graphite">{t.nowHelp}</p>
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        <>
          {looksSignedIn() && !result && <p className="text-sm text-graphite">{t.noSubscription}</p>}
          <CancelRequestForm locale={locale} />
        </>
      )}

      <section>
        <h2>{t.otherWays}</h2>
        <ul className="space-y-1.5 ps-2">
          <li><strong>{t.byEmail}:</strong> <EmailLink email={BUSINESS.supportEmail} missing={locale === 'he' ? 'מייל התמיכה' : 'support email'} /></li>
          <li><strong>{t.byPhone}:</strong> <PhoneLink phone={BUSINESS.phone} missing={locale === 'he' ? 'מספר הטלפון' : 'phone number'} /></li>
          <li><strong>{t.byMail}:</strong> <BusinessValue value={locale === 'he' ? BUSINESS.addressHe : BUSINESS.address} missing={locale === 'he' ? 'כתובת העסק' : 'business address'} /></li>
          {PORTAL_URL && <li><a href={PORTAL_URL} dir="ltr">{t.portal}</a></li>}
        </ul>
        <p className="mt-4"><Link href={localePath(locale, '/refund')}>{t.refundPolicy}</Link></p>
      </section>
    </div>
  );
}

function CancelRequestForm({ locale }: { locale: Locale }) {
  const t = cancelMessages[locale];
  const id = useId();
  const [form, setForm] = useState({ name: '', idNumber: '', email: '', note: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'invalid' | 'failed'>('idle');
  const [reference, setReference] = useState<string | null>(null);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setState('invalid');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'cancellation', name: form.name, idNumber: form.idNumber, email: form.email, message: form.note, page: window.location.pathname }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.reference) throw new Error(data?.error);
      setReference(data.reference);
      setState('idle');
    } catch {
      setState('failed');
    }
  };

  if (reference) return <p role="status" className="rounded-xl bg-lime text-ink p-4 text-sm font-semibold">{t.sent(reference)}</p>;
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: event.target.value }));
    if (state === 'invalid') setState('idle');
  };
  return (
    <section>
      <h2>{t.formTitle}</h2>
      <p>{t.formIntro}</p>
      <form onSubmit={send} noValidate className="mt-4 space-y-4" aria-describedby={state === 'invalid' || state === 'failed' ? `${id}-error` : undefined}>
        <label className="block text-sm">
          <span className="block font-medium mb-1.5">{t.name}</span>
          <input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={100} className={field} />
        </label>
        <label className="block text-sm">
          <span className="block font-medium mb-1.5">{t.email}</span>
          <input type="email" dir="ltr" value={form.email} onChange={set('email')} autoComplete="email" required maxLength={254} className={field} />
        </label>
        <label className="block text-sm">
          <span className="block font-medium mb-1.5">{t.idNumber}</span>
          <input inputMode="numeric" dir="ltr" value={form.idNumber} onChange={set('idNumber')} maxLength={12} className={field} />
        </label>
        <label className="block text-sm">
          <span className="block font-medium mb-1.5">{t.note}</span>
          <textarea value={form.note} onChange={set('note')} rows={3} maxLength={4000} className={field} />
        </label>
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700 empty:hidden">
          {state === 'invalid' ? t.invalid : state === 'failed' ? t.sendFailed : ''}
        </p>
        <button type="submit" disabled={state === 'sending'} className="btn-primary disabled:opacity-60">
          {state === 'sending' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {state === 'sending' ? t.sending : t.send}
        </button>
      </form>
    </section>
  );
}
