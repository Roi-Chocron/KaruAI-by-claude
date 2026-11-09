'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Loader2, Receipt } from 'lucide-react';
import { RequireAuth } from '@/lib/session';
import { MonthlyYearlyToggle, PricingCards } from '@/components/pricing-cards';
import type { Plan } from '@/shared/plans';
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

function BillingPage() {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    fetchAccount().then(setAccount).catch(err => setError(err instanceof Error ? err.message : 'Could not load your plan.'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans" dir="ltr">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing & Plan</h1>
          <p className="text-slate-500 mt-1">Your plan, this month&apos;s usage, and the available plans.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">{error}</p>}

        {!account ? (
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
                  <div className="text-3xl font-bold text-slate-900">${account.plan.monthlyPrice}</div>
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
                <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-2"><CreditCard size={18} /> Payment method</h2>
                <p className="text-sm text-slate-500">Online payments are coming soon. Until then, contact us to change your plan.</p>
              </section>
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-2"><Receipt size={18} /> Invoices</h2>
                <p className="text-sm text-slate-500">No invoices yet.</p>
              </section>
            </div>
          </div>
        )}

        <section className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Plans</h2>
            <MonthlyYearlyToggle yearly={yearly} onChange={setYearly} />
          </div>
          <PricingCards
            yearly={yearly}
            action={plan => (
              <button
                type="button"
                disabled
                className={`w-full py-3 px-4 rounded-xl font-semibold border-2 ${
                  plan.id === account?.plan.id ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-slate-200 text-slate-400 bg-white'
                }`}
              >
                {plan.id === account?.plan.id ? 'Your current plan' : 'Coming soon'}
              </button>
            )}
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
