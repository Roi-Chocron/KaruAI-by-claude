'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, Receipt } from 'lucide-react';
import { AppShell, PageHeading } from '@/components/app-shell';
import { appMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
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
const resetDate = (locale: Locale) => {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
    .toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' });
};

export function UsageMeter({ label, used, limit, unlimited }: { label: string; used: number; limit: number | null; unlimited: string }) {
  const share = limit ? Math.min(1, used / limit) : 0;
  const color = share >= 1 ? 'bg-red-700' : share >= 0.8 ? 'bg-amber-500' : 'bg-ink';
  return (
    <div>
      <div className="flex justify-between gap-4 text-sm mb-2">
        <span className="font-medium">{label}</span>
        <span className="text-graphite tabular-nums" dir="ltr">{used.toLocaleString()} / {limit === null ? unlimited : limit.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-mist overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${limit === null ? 0 : share * 100}%` }} />
      </div>
    </div>
  );
}

function BillingPage({ locale }: { locale: Locale }) {
  const t = appMessages[locale].billing;
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    fetchAccount().then(setAccount).catch(err => setError(err instanceof Error ? err.message : t.loadFailed));
  }, [t.loadFailed]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeading title={t.title} sub={t.sub} />

      {error && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4 mb-8">{error}</p>}

      {!account ? (
        !error && <div className="flex items-center gap-2 text-sm text-graphite"><Loader2 size={16} className="animate-spin" /> {appMessages[locale].shell.loading}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 rounded-2xl bg-ink text-paper p-7 sm:p-9">
            <div className="flex justify-between items-start gap-6 mb-8">
              <div>
                <p className="text-sm text-paper/70">{t.current}</p>
                <h2 className="font-display font-bold text-6xl leading-none mt-1" dir="ltr">{account.plan.name}</h2>
                <p className="text-sm text-paper/70 mt-3">{t.resets(resetDate(locale))}</p>
              </div>
              <div className="text-end">
                <span className="font-display font-bold text-6xl leading-none" dir="ltr">${account.plan.monthlyPrice}</span>
                <p className="text-sm text-paper/70">{t.perMonth}</p>
              </div>
            </div>
            <div className="space-y-6 rounded-xl bg-paper text-ink p-6">
              <UsageMeter label={t.carousels} used={account.usage.carousels} limit={account.plan.limits.carouselsPerMonth} unlimited={t.unlimited} />
              <UsageMeter label={t.messages} used={account.usage.messages} limit={account.plan.limits.aiMessagesPerMonth} unlimited={t.unlimited} />
              <UsageMeter label={t.images} used={account.usage.images} limit={account.plan.limits.aiImagesPerMonth} unlimited={t.unlimited} />
            </div>
          </section>

          <div className="grid gap-4 content-start">
            <section className="rounded-2xl border border-line p-6">
              <h2 className="flex items-center gap-2 font-semibold mb-2"><CreditCard size={18} strokeWidth={1.75} /> {t.payment}</h2>
              <p className="text-sm text-graphite leading-relaxed">{t.paymentBody}</p>
            </section>
            <section className="rounded-2xl border border-line p-6">
              <h2 className="flex items-center gap-2 font-semibold mb-2"><Receipt size={18} strokeWidth={1.75} /> {t.invoices}</h2>
              <p className="text-sm text-graphite">{t.invoicesBody}</p>
            </section>
          </div>
        </div>
      )}

      <section className="mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <h2 className="font-display font-bold text-5xl md:text-6xl leading-none">{t.plans}</h2>
          <MonthlyYearlyToggle yearly={yearly} onChange={setYearly} locale={locale} />
        </div>
        <PricingCards
          yearly={yearly}
          locale={locale}
          action={plan => (
            <button
              type="button"
              disabled
              className={`btn w-full ${plan.id === account?.plan.id ? (plan.highlighted ? 'bg-lime text-ink' : 'bg-ink text-paper') : plan.highlighted ? 'border border-paper/30 text-paper/70' : 'border border-line text-graphite'}`}
            >
              {plan.id === account?.plan.id ? t.yourPlan : t.soon}
            </button>
          )}
        />
      </section>
    </main>
  );
}

// The page as the /billing route shows it: only for signed-in users
export function ProtectedBillingPage() {
  return <RequireAuth>{user => <AppShell user={user} active="billing">{locale => <BillingPage locale={locale} />}</AppShell>}</RequireAuth>;
}
