'use client';

import type { ReactNode } from 'react';
import { CheckCircle } from 'lucide-react';
import { formatPrice, PLANS, PLAN_IDS, type Plan } from '@/shared/plans';

// The plan cards of the landing page and the billing page; `action` renders each card's button
export function PricingCards({ action }: { action: (plan: Plan) => ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
      {PLAN_IDS.map(id => {
        const plan = PLANS[id];
        return (
          <div
            key={id}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
              plan.highlighted ? 'border-2 border-blue-600 bg-white shadow-xl xl:scale-105' : 'border border-slate-200 bg-slate-50/50 hover:shadow-lg'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold py-1 px-4 rounded-full uppercase tracking-wider shadow">
                {plan.badge}
              </div>
            )}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                {!plan.highlighted && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">{plan.badge}</span>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">{formatPrice(plan.monthlyPrice)}</span>
                <span className="text-slate-500 text-sm"> / month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-slate-700">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
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
