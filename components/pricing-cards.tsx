'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { PLANS, PLAN_IDS, type Plan } from '@/shared/plans';
import { homeMessages, planCopyHe } from '@/messages/home';
import type { Locale } from '@/lib/i18n';

export function MonthlyYearlyToggle({ yearly, onChange, locale = 'en' }: { yearly: boolean; onChange: (yearly: boolean) => void; locale?: Locale }) {
  const t = homeMessages[locale].pricing;
  const option = (value: boolean, label: ReactNode) => (
    <button
      type="button"
      aria-pressed={yearly === value}
      onClick={() => onChange(value)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${yearly === value ? 'bg-ink text-paper' : 'text-graphite hover:text-ink'}`}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex self-start md:self-auto items-center gap-1 p-1 rounded-xl border border-line bg-paper">
      {option(false, t.monthly)}
      {option(true, <>{t.yearly} <span className={`ms-1 rounded px-1.5 py-0.5 text-xs ${yearly ? 'bg-lime text-ink' : 'bg-mist text-ink'}`} dir="ltr">−17%</span></>)}
    </div>
  );
}

// The plan cards of the landing page and the billing page; `action` renders each card's button
export function PricingCards({ yearly, action, locale = 'en' }: { yearly: boolean; action: (plan: Plan) => ReactNode; locale?: Locale }) {
  const t = homeMessages[locale].pricing;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
      {PLAN_IDS.map(id => {
        const plan = PLANS[id];
        const copy = locale === 'he' ? planCopyHe[id] : plan;
        const price = yearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
        const dark = plan.highlighted;
        return (
          <div
            key={id}
            className={`rounded-2xl p-7 flex flex-col justify-between ${dark ? 'bg-ink text-paper' : 'bg-paper border border-line'}`}
          >
            <div>
              <div className="flex justify-between items-center gap-3 mb-3">
                <h3 className="font-display font-bold text-4xl leading-none" dir="ltr">{plan.name}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${dark ? 'bg-lime text-ink' : 'bg-mist text-ink'}`}>{copy.badge}</span>
              </div>
              <p className={`text-sm mb-6 min-h-[40px] ${dark ? 'text-paper/70' : 'text-graphite'}`}>{copy.description}</p>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="font-display font-bold text-7xl leading-none" dir="ltr">${price}</span>
                <span className={`text-sm ${dark ? 'text-paper/70' : 'text-graphite'}`}>{t.perMonth}</span>
              </div>
              {yearly && price > 0 && <p className={`-mt-4 mb-6 text-xs ${dark ? 'text-paper/70' : 'text-graphite'}`}>{t.billedYearly(price * 12)}</p>}
              <ul className={`space-y-3 mb-8 text-sm border-t pt-6 ${dark ? 'border-paper/15' : 'border-line'}`}>
                {copy.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${dark ? 'text-lime' : 'text-ink'}`} strokeWidth={2.5} />
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
  );
}
