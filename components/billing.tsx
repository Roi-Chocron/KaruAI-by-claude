'use client';

import React, { useEffect, useId, useState } from 'react';
import { CreditCard, Loader2, Receipt } from 'lucide-react';
import { AppShell, PageHeading } from '@/components/app-shell';
import { appMessages } from '@/messages/app';
import type { Locale } from '@/lib/i18n';
import { useLocale } from '@/lib/locale';
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

function BillingPage({ locale }: { locale: Locale }) {
  const t = appMessages[locale].billing;
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    fetchAccount().then(setAccount).catch(() => setFailed(true));
  }, []);

  const limits = account && [
    { label: t.carousels, used: account.usage.carousels, limit: account.plan.limits.carouselsPerMonth },
    { label: t.messages, used: account.usage.messages, limit: account.plan.limits.aiMessagesPerMonth },
    { label: t.images, used: account.usage.images, limit: account.plan.limits.aiImagesPerMonth },
  ];
  const reached = limits?.filter(meter => meter.limit !== null && meter.used >= meter.limit) ?? [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeading title={t.title} sub={t.sub} />

      {failed && <p role="alert" className="text-sm text-red-700 border border-red-700 rounded-xl p-4 mb-8">{t.loadFailed}</p>}

      {!account || !limits ? (
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
                <span className="block font-display font-bold text-5xl sm:text-6xl leading-none"><bdi dir="ltr">${account.plan.monthlyPrice}</bdi></span>
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

      <section id="plans" aria-labelledby="plans-heading" className="mt-16 sm:mt-20 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <h2 id="plans-heading" className="font-display font-bold text-5xl md:text-6xl leading-none">{t.plans}</h2>
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
  const locale = useLocale();
  // The tab title in the visitor's language. Next writes the static (English) one into <head> after a client-side
  // navigation, sometimes after this runs (as on the redirect from sign-in), so keep it right while the page is open.
  useEffect(() => {
    const title = `${appMessages[locale].billing.title} - KaruAI`;
    const apply = () => {
      if (document.title !== title) document.title = title;
      document.querySelectorAll('head title').forEach(el => {
        if (el.textContent !== title) el.textContent = title;
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);
  return <RequireAuth>{user => <AppShell user={user} active="billing">{locale => <BillingPage locale={locale} />}</AppShell>}</RequireAuth>;
}
