'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { formatPrice, PLANS, PLAN_IDS, type Plan } from '@/shared/plans';
import { homeMessages, planCopyHe } from '@/messages/home';
import type { Locale } from '@/lib/i18n';

// The plan cards of the landing page and the billing page; `action` renders each card's button
export function PricingCards({ action, locale = 'en' }: { action: (plan: Plan) => ReactNode; locale?: Locale }) {
  const t = homeMessages[locale].pricing;
  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
      {PLAN_IDS.map(id => {
        const plan = PLANS[id];
        const copy = locale === 'he' ? planCopyHe[id] : plan;
        const dark = plan.highlighted;
        return (
          <div
            key={id}
            className={`rounded-2xl p-7 flex flex-col justify-between ${dark ? 'bg-ink text-paper [&_:focus-visible]:outline-lime' : 'bg-paper border border-line'}`}
          >
            <div>
              <div className="flex justify-between items-center gap-3 mb-3">
                <h3 className="font-display font-bold text-4xl leading-none" dir="ltr">{plan.name}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${dark ? 'bg-lime text-ink' : 'bg-mist text-ink'}`}>{copy.badge}</span>
              </div>
              <p className={`text-sm mb-6 min-h-[40px] xl:min-h-[3.75rem] ${dark ? 'text-paper/70' : 'text-graphite'}`}>{copy.description}</p>
              <div className="mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display font-bold text-7xl xl:text-6xl leading-none" dir="ltr">{formatPrice(plan.monthlyPrice)}</span>
                <span className={`text-sm ${dark ? 'text-paper/70' : 'text-graphite'}`}>{t.perMonth}</span>
              </div>
              <ul className={`space-y-3 mb-8 text-sm border-t pt-6 ${dark ? 'border-paper/15' : 'border-line'}`}>
                {copy.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check aria-hidden="true" className={`w-4 h-4 mt-0.5 flex-shrink-0 ${dark ? 'text-lime' : 'text-ink'}`} strokeWidth={2.5} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            {action(plan)}
          </div>
        );
      })}
    </div>
    <p className="mt-6 text-sm text-graphite">{t.billedMonthly}</p>
    </>
  );
}
