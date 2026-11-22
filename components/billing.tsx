'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CreditCard, Loader2, Receipt } from 'lucide-react';
import { AppShell, PageHeading } from '@/components/app-shell';
import { appMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
import { useLocale } from '@/lib/locale';
import { RequireAuth } from '@/lib/session';
import { useTabTitle } from '@/lib/tab-title';
import { PricingCards } from '@/components/pricing-cards';
import { formatPrice, isPaidPlanId, PLANS, type PaidPlanId, type Plan } from '@/shared/plans';
import type { MonthlyUsage, PublicUser } from '@/types';

export type AccountSummary = { user: PublicUser; plan: Plan; usage: MonthlyUsage; carouselCount: number };

export async function fetchAccount(): Promise<AccountSummary> {
  const res = await fetch('/api/account');
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
  return data;
}

// The first day of next month, when the monthly limits reset
const intlLocale = (locale: Locale) => (locale === 'he' ? 'he-IL' : 'en-GB');
const resetDate = (locale: Locale) => {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
    .toLocaleDateString(intlLocale(locale), { dateStyle: 'long', timeZone: 'UTC' });
};


// One month's use of a limit, as a labelled progress bar; it fills from the start side in either direction
export function UsageMeter({ label, used, limit, unlimited }: { label: string; used: number; limit: number | null; unlimited: string }) {
  const locale = useLocale();
  const t = appMessages[locale].billing;
  const format = (n: number) => n.toLocaleString(intlLocale(locale));
  const share = limit ? Math.min(1, used / limit) : 0;
  const color = share >= 1 ? 'bg-red-700' : share >= 0.8 ? 'bg-amber-500' : 'bg-ink';
  const id = useId();
  return (
    <div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm mb-2">
        <span id={id} className="font-medium">{label}</span>
        {/* Screen readers get the numbers from the bar (or, without a limit, from a sentence) */}
        <span className="text-graphite tabular-nums" aria-hidden="true">
          <bdi dir="ltr">{format(used)} / {limit === null ? unlimited : format(limit)}</bdi>
        </span>
        {limit === null && <span className="sr-only">{t.usedUnlimited(format(used))}</span>}
      </div>
      {limit === null ? (
        <div aria-hidden="true" className="h-2 rounded-full bg-mist" />
      ) : (
        <div
          role="progressbar"
          aria-labelledby={id}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(used, limit)}
          aria-valuetext={t.usedOf(format(used), format(limit))}
          className="h-2 rounded-full bg-mist overflow-hidden"
        >
          <div className={`h-full rounded-full ${color}`} style={{ width: `${share * 100}%` }} />
        </div>
      )}
    </div>
  );
}

export type BillingSummary = {
  enabled: boolean;
  subscription: { plan: PaidPlanId; status: string; active: boolean; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
};

type BillingError = keyof (typeof appMessages)['en']['billing']['errors'];

// A request the API answers with { url } (Polar's checkout or customer portal); its English errors become our own keys
class BillingRequestError extends Error {
  constructor(readonly key: BillingError) {
    super(key);
  }
}

async function postForUrl(path: string, body?: unknown): Promise<string> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new BillingRequestError('unavailable');
  }
  const data = await res.json().catch(() => null);
  if (res.ok && typeof data?.url === 'string') return data.url;
  if (res.status === 503) throw new BillingRequestError('notConfigured');
  if (res.status === 409) throw new BillingRequestError('hasSubscription');
  if (res.status === 502) throw new BillingRequestError('unavailable');
  throw new BillingRequestError('failed');
}

// The subscription, after the API asked Polar about it (so a missed or slow webhook does not leave the plan behind)
async function syncBilling(): Promise<BillingSummary> {
  const res = await fetch('/api/billing/sync', { method: 'POST' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
  return data;
}

// A plan name inside a sentence, isolated so it reads correctly in right-to-left text
const isolate = (name: string) => `\u2068${name}\u2069`;

// After Polar's checkout the subscription may appear a few seconds after the user returns, so the page asks again a few times
const ACTIVATION_POLLS = 15;
const ACTIVATION_POLL_MS = 2000;

function BillingPage({ locale }: { locale: Locale }) {
  const t = appMessages[locale].billing;
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [failed, setFailed] = useState(false);
  // Shown beside the button that failed: the subscription box (portal) or the plans (checkout)
  const [actionError, setActionError] = useState<{ key: BillingError; at: 'portal' | 'plans' } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [activation, setActivation] = useState<'waiting' | 'slow' | null>(null);
  const autoCheckout = useRef(false);
  const plansAlert = useRef<HTMLParagraphElement>(null);

  // The account (plan and usage) is read after the sync, which can change the plan
  const load = useCallback(async () => {
    const nextBilling = await syncBilling();
    const nextAccount = await fetchAccount();
    setAccount(nextAccount);
    setBilling(nextBilling);
    return nextBilling;
  }, []);

  const go = useCallback(async (key: string, request: () => Promise<string>) => {
    setBusy(key);
    setActionError(null);
    try {
      window.location.href = await request();
    } catch (err) {
      setActionError({ key: err instanceof BillingRequestError ? err.key : 'failed', at: key === 'portal' ? 'portal' : 'plans' });
      setBusy(null);
    }
  }, []);
  const checkout = useCallback((plan: PaidPlanId) => go(plan, () => postForUrl('/api/billing/checkout', { plan })), [go]);
  const openPortal = useCallback(() => go('portal', () => postForUrl('/api/billing/portal')), [go]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returning = params.get('checkout') === 'success';
    const wanted = params.get('plan');
    if (returning || wanted) window.history.replaceState(null, '', '/billing');

    let cancelled = false;
    (async () => {
      let state = await load();
      if (returning && !state.subscription?.active) {
        setActivation('waiting');
        for (let i = 0; i < ACTIVATION_POLLS && !cancelled && !state.subscription?.active; i++) {
          await new Promise(resolve => setTimeout(resolve, ACTIVATION_POLL_MS));
          state = await load();
        }
        if (!cancelled) setActivation(state.subscription?.active ? null : 'slow');
      }
      // Coming from "Get <plan>" on the landing page: straight on to the checkout
      if (!cancelled && isPaidPlanId(wanted) && state.enabled && !state.subscription?.active && !autoCheckout.current) {
        autoCheckout.current = true;
        checkout(wanted);
      }
    })().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [load, checkout]);

  // On a phone the plans' error can be a few cards above the button that was pressed
  useEffect(() => {
    if (actionError?.at === 'plans') plansAlert.current?.scrollIntoView({ block: 'center' });
  }, [actionError]);

  const subscription = billing?.subscription ?? null;
  const subscribed = !!subscription?.active;
  const longDate = (iso: string) => new Date(iso).toLocaleDateString(intlLocale(locale), { dateStyle: 'long' });

  const limits = account && [
    { label: t.carousels, used: account.usage.carousels, limit: account.plan.limits.carouselsPerMonth },
    { label: t.messages, used: account.usage.messages, limit: account.plan.limits.aiMessagesPerMonth },
    { label: t.images, used: account.usage.images, limit: account.plan.limits.aiImagesPerMonth },
  ];
  const reached = limits?.filter(meter => meter.limit !== null && meter.used >= meter.limit) ?? [];

  const subscriptionText = !billing?.enabled
    ? t.paymentBody
    : !subscription
      ? t.freeBody
      : subscription.active && subscription.currentPeriodEnd
        ? (subscription.cancelAtPeriodEnd ? t.cancels : t.renews)(isolate(PLANS[subscription.plan].name), longDate(subscription.currentPeriodEnd))
        : t.manageAny;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeading title={t.title} sub={t.sub} />

      <div aria-live="polite" className="empty:hidden space-y-4 mb-8">
        {failed && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{t.loadFailed}</p>}
        {activation === 'waiting' && (
          <p className="flex items-center gap-2 text-sm rounded-xl bg-lime text-ink p-4">
            <Loader2 size={16} className="animate-spin flex-none" aria-hidden="true" /> {t.activating}
          </p>
        )}
        {activation === 'slow' && <p className="text-sm rounded-xl border border-line p-4">{t.activationSlow}</p>}
        {subscription && !subscription.active && subscription.status === 'past_due' && (
          <p className="text-sm text-amber-900 rounded-xl border border-amber-500 bg-amber-50 p-4">{t.pastDue}</p>
        )}
      </div>

      {!account || !billing || !limits ? (
        !failed && (
          <div role="status" className="flex items-center gap-2 text-sm text-graphite">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {appMessages[locale].shell.loading}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 rounded-2xl bg-ink text-paper p-7 sm:p-9">
            <div className="flex flex-wrap justify-between items-start gap-x-6 gap-y-4 mb-8">
              <div className="min-w-0">
                <p className="text-sm text-paper/70">{t.current}</p>
                <h2 className="font-display font-bold text-5xl sm:text-6xl leading-none mt-1 break-words"><bdi dir="ltr">{account.plan.name}</bdi></h2>
                <p className="text-sm text-paper/70 mt-3">{t.resets(resetDate(locale))}</p>
              </div>
              <p className="sm:text-end">
                <span className="block font-display font-bold text-5xl sm:text-6xl leading-none"><bdi dir="ltr">{formatPrice(account.plan.monthlyPrice)}</bdi></span>
                <span className="block text-sm text-paper/70 mt-1">{t.perMonth}</span>
              </p>
            </div>
            <div className="space-y-6 rounded-xl bg-paper text-ink p-5 sm:p-6">
              {limits.map(meter => <UsageMeter key={meter.label} {...meter} unlimited={t.unlimited} />)}
              {reached.length > 0 && (
                <p className="text-sm text-red-700">
                  {t.limitReached(reached.map(meter => meter.label).join(', '))}{' '}
                  <a href="#plans" className="inline-block py-2.5 -my-2.5 font-semibold underline underline-offset-4">{t.seePlans}</a>
                </p>
              )}
            </div>
          </section>

          <div className="grid gap-4 content-start">
            <section className="rounded-2xl border border-line p-6">
              <h2 className="flex items-center gap-2 font-semibold mb-2"><CreditCard size={18} strokeWidth={1.75} aria-hidden="true" /> {t.payment}</h2>
              <p className="text-sm text-graphite leading-relaxed">{subscriptionText}</p>
              {billing.enabled && subscription && (
                <button type="button" onClick={openPortal} disabled={busy !== null} className="btn-secondary w-full mt-4 disabled:opacity-60">
                  {busy === 'portal' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {t.manage}
                </button>
              )}
              {actionError?.at === 'portal' && <p role="alert" className="mt-3 text-sm text-red-700">{t.errors[actionError.key]}</p>}
            </section>
            <section className="rounded-2xl border border-line p-6">
              <h2 className="flex items-center gap-2 font-semibold mb-2"><Receipt size={18} strokeWidth={1.75} aria-hidden="true" /> {t.invoices}</h2>
              <p className="text-sm text-graphite">{billing.enabled && subscription ? t.invoicesPortal : t.invoicesBody}</p>
            </section>
          </div>
        </div>
      )}

      <section id="plans" aria-labelledby="plans-heading" className="mt-16 sm:mt-20 scroll-mt-24">
        <h2 id="plans-heading" className="font-display font-bold text-5xl md:text-6xl leading-none mb-8">{t.plans}</h2>
        <div aria-live="polite" className="empty:hidden mb-6">
          {actionError?.at === 'plans' && <p ref={plansAlert} role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4">{t.errors[actionError.key]}</p>}
          {busy && busy !== 'portal' && (
            <p role="status" className="flex items-center gap-2 text-sm text-graphite">
              <Loader2 size={16} className="animate-spin flex-none" aria-hidden="true" /> {t.redirecting}
            </p>
          )}
        </div>
        <PricingCards
          locale={locale}
          action={plan => {
            const current = plan.id === account?.plan.id;
            const name = isolate(plan.name);
            const label = current
              ? t.yourPlan
              : !billing?.enabled
                ? t.soon
                : subscribed
                  ? plan.id === 'free' ? t.cancelInPortal : t.switchTo(name)
                  : plan.id === 'free' ? t.included : t.upgrade(name);
            const disabled = current || !billing?.enabled || busy !== null || (!subscribed && plan.id === 'free');
            const style = current
              ? plan.highlighted ? 'bg-lime text-ink' : 'bg-ink text-paper'
              : disabled
                ? plan.highlighted ? 'border border-paper/30 text-paper/70' : 'border border-line text-graphite'
                : plan.highlighted ? 'btn-lime' : 'btn-secondary';
            return (
              <button
                type="button"
                disabled={disabled}
                onClick={() => (subscribed ? openPortal() : isPaidPlanId(plan.id) && checkout(plan.id))}
                className={`btn w-full whitespace-normal text-center ${style}`}
              >
                {busy === plan.id && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {label}
              </button>
            );
          }}
        />
      </section>
    </main>
  );
}

// The page as the /billing route shows it: only for signed-in users
export function ProtectedBillingPage() {
  const locale = useLocale();
  // Named before sign-in is confirmed too, not only once the page heading renders
  useTabTitle(`${appMessages[locale].billing.title} - KaruAI`);
  return <RequireAuth>{user => <AppShell user={user} active="billing">{locale => <BillingPage locale={locale} />}</AppShell>}</RequireAuth>;
}
