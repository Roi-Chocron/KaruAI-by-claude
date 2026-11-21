'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Loader2, Receipt } from 'lucide-react';
import { RequireAuth } from '@/lib/session';
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
const resetDate = () => {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toLocaleDateString('en-GB', { dateStyle: 'long' });
};

export function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const share = limit ? Math.min(1, used / limit) : 0;
  const color = share >= 1 ? 'bg-red-500' : share >= 0.8 ? 'bg-amber-500' : 'bg-blue-600';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{used.toLocaleString()} / {limit === null ? 'Unlimited' : limit.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${limit === null ? 0 : share * 100}%` }} />
      </div>
    </div>
  );
}

export type BillingSummary = {
  enabled: boolean;
  subscription: { plan: PaidPlanId; status: string; active: boolean; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
};

async function postForUrl(path: string, body?: unknown): Promise<string> {
  const res = await fetch(path, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.url) throw new Error(data?.error || `Request failed with status ${res.status}`);
  return data.url;
}

const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { dateStyle: 'long' });

// After Polar's checkout the webhook may land a few seconds after the user does, so the page asks again a few times
const ACTIVATION_POLLS = 15;
const ACTIVATION_POLL_MS = 2000;

function BillingPage() {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const autoCheckout = useRef(false);

  const load = useCallback(async () => {
    const [nextAccount, res] = await Promise.all([fetchAccount(), fetch('/api/billing')]);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
    setAccount(nextAccount);
    setBilling(data);
    return { account: nextAccount, billing: data as BillingSummary };
  }, []);

  const go = useCallback(async (key: string, request: () => Promise<string>) => {
    setBusy(key);
    setError(null);
    try {
      window.location.href = await request();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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
      if (returning && !state.billing.subscription?.active) {
        setActivating(true);
        for (let i = 0; i < ACTIVATION_POLLS && !cancelled && !state.billing.subscription?.active; i++) {
          await new Promise(resolve => setTimeout(resolve, ACTIVATION_POLL_MS));
          state = await load();
        }
        if (!cancelled) setActivating(false);
      }
      // Coming from "Choose <plan>" on the landing page: straight on to the checkout
      if (!cancelled && isPaidPlanId(wanted) && state.billing.enabled && !state.billing.subscription?.active && !autoCheckout.current) {
        autoCheckout.current = true;
        checkout(wanted);
      }
    })().catch(err => setError(err instanceof Error ? err.message : 'Could not load your plan.'));
    return () => {
      cancelled = true;
    };
  }, [load, checkout]);

  const subscription = billing?.subscription ?? null;
  const subscribed = !!subscription?.active;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans" dir="ltr">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing & Plan</h1>
          <p className="text-slate-500 mt-1">Your plan, this month&apos;s usage, and the available plans.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">{error}</p>}
        {activating && (
          <p className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Loader2 size={16} className="animate-spin" /> Payment received. Activating your plan…
          </p>
        )}
        {subscription && !subscription.active && subscription.status === 'past_due' && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
            Your last payment did not go through, so your plan is paused. Update your card in &quot;Manage subscription&quot;.
          </p>
        )}

        {!account || !billing ? (
          !error && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Current plan: {account.plan.name}</h2>
                  <p className="text-slate-500 text-sm mt-1">Limits reset on {resetDate()}.</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{formatPrice(account.plan.monthlyPrice)}</div>
                  <div className="text-sm text-slate-500">per month</div>
                </div>
              </div>
              <div className="space-y-5">
                <UsageMeter label="New carousels" used={account.usage.carousels} limit={account.plan.limits.carouselsPerMonth} />
                <UsageMeter label="AI design messages" used={account.usage.messages} limit={account.plan.limits.aiMessagesPerMonth} />
                <UsageMeter label="AI images" used={account.usage.images} limit={account.plan.limits.aiImagesPerMonth} />
              </div>
            </section>

            <div className="space-y-8">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-2"><CreditCard size={18} /> Subscription</h2>
                {!billing.enabled ? (
                  <p className="text-sm text-slate-500">Online payments are coming soon. Until then, contact us to change your plan.</p>
                ) : subscription ? (
                  <>
                    <p className="text-sm text-slate-500 mb-4">
                      {subscription.active && subscription.currentPeriodEnd
                        ? subscription.cancelAtPeriodEnd
                          ? `Canceled: your ${PLANS[subscription.plan].name} plan stays until ${longDate(subscription.currentPeriodEnd)}.`
                          : `${PLANS[subscription.plan].name} renews on ${longDate(subscription.currentPeriodEnd)}.`
                        : 'Change your plan, card or cancel at any time.'}
                    </p>
                    <button
                      type="button"
                      onClick={openPortal}
                      disabled={busy !== null}
                      className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl font-semibold border-2 border-slate-200 text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {busy === 'portal' && <Loader2 size={16} className="animate-spin" />} Manage subscription
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">You are on the free plan. Pick a plan below to upgrade; payments are handled securely by Polar.</p>
                )}
              </section>
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-2"><Receipt size={18} /> Invoices</h2>
                <p className="text-sm text-slate-500">
                  {billing.enabled && subscription ? 'Your invoices are in "Manage subscription".' : 'No invoices yet.'}
                </p>
              </section>
            </div>
          </div>
        )}

        <section className="pt-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">Plans</h2>
          <PricingCards
            action={plan => {
              const current = plan.id === account?.plan.id;
              const label = current
                ? 'Your current plan'
                : !billing?.enabled
                  ? 'Coming soon'
                  : subscribed
                    ? plan.id === 'free' ? 'Cancel in Manage subscription' : `Switch to ${plan.name}`
                    : plan.id === 'free' ? 'Included' : `Upgrade to ${plan.name}`;
              const disabled = current || !billing?.enabled || busy !== null || (!subscribed && plan.id === 'free');
              return (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => (subscribed ? openPortal() : isPaidPlanId(plan.id) && checkout(plan.id))}
                  className={`w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-semibold border-2 transition-colors ${
                    current
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : disabled
                        ? 'border-slate-200 text-slate-400 bg-white'
                        : plan.highlighted
                          ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                          : 'border-slate-300 text-slate-800 bg-white hover:bg-slate-100'
                  }`}
                >
                  {busy === plan.id && <Loader2 size={16} className="animate-spin" />} {label}
                </button>
              );
            }}
          />
        </section>
      </div>
    </div>
  );
}

// The page as the /billing route shows it: only for signed-in users
export function ProtectedBillingPage() {
  return <RequireAuth>{() => <BillingPage />}</RequireAuth>;
}
