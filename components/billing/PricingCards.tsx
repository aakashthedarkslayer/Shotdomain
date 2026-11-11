'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { PLANS, PRICING_ORDER } from '@/lib/plans';
import type { Interval, Plan, PlanId } from '@/lib/plans';

/** Price shown on a card for the chosen interval (yearly shown per month). */
function priceLabel(plan: Plan, interval: Interval): { amount: string; cadence: string; note?: string } {
  if (plan.price.once !== undefined) return { amount: `$${plan.price.once}`, cadence: 'one-time' };
  if (!plan.price.month) return { amount: '$0', cadence: 'forever' };
  if (interval === 'year' && plan.price.year) {
    const perMonth = plan.price.year / 12;
    return {
      amount: `$${Number.isInteger(perMonth) ? perMonth : perMonth.toFixed(2)}`,
      cadence: 'per month',
      note: `$${plan.price.year} billed yearly`,
    };
  }
  return { amount: `$${plan.price.month}`, cadence: 'per month', note: plan.price.year ? 'billed monthly' : undefined };
}

/** Months free when paying yearly, e.g. "2 months free". */
function yearlySaving(): string {
  const s = PLANS.studio.price;
  const months = s.month && s.year ? Math.round(12 - s.year / s.month) : 0;
  return months > 0 ? `${months} months free` : '';
}

export function IntervalToggle({ value, onChange }: { value: Interval; onChange: (v: Interval) => void }) {
  const saving = yearlySaving();
  return (
    <div role="radiogroup" aria-label="Billing period" className="glass inline-flex rounded-full p-1 text-sm">
      {(['month', 'year'] as const).map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition ${
            value === i ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-fg'
          }`}
        >
          {i === 'month' ? 'Monthly' : 'Yearly'}
          {i === 'year' && saving && (
            <span className={`rounded-full px-1.5 py-px text-[11px] ${value === i ? 'bg-white/20' : 'bg-success-soft text-success'}`}>{saving}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * The plan cards. `action` renders each card's button (a link on the
 * homepage, checkout / switch buttons on the billing page).
 */
export function PricingCards({
  action,
  highlight,
  current,
  initialInterval = 'month',
}: {
  action: (plan: Plan, interval: Interval) => ReactNode;
  /** Card to emphasise (default: the one with a badge). */
  highlight?: PlanId;
  /** The user's current plan, marked on its card. */
  current?: PlanId;
  initialInterval?: Interval;
}) {
  const [interval, setPeriod] = useState<Interval>(initialInterval);
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <IntervalToggle value={interval} onChange={setPeriod} />
      </div>
      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PRICING_ORDER.map((id) => {
          const plan = PLANS[id];
          const featured = highlight ? highlight === id : Boolean(plan.badge);
          const price = priceLabel(plan, interval);
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-2xl p-6 ${
                featured ? 'glass-strong shadow-[0_24px_60px_-20px_color-mix(in_srgb,var(--accent)_45%,transparent)] ring-2 ring-accent/60' : 'glass'
              }`}
            >
              {(current === id || plan.badge) && (
                <span
                  className={`absolute -top-3 left-6 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                    current === id ? 'bg-success text-white' : 'bg-brand text-white'
                  }`}
                >
                  {current === id ? 'Your plan' : plan.badge}
                </span>
              )}
              <h3 className="text-[15px] font-semibold text-fg">{plan.name}</h3>
              <p className="mt-1 min-h-[2.5rem] text-sm text-muted">{plan.tagline}</p>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className={`text-4xl font-semibold tracking-tight ${featured ? 'text-brand' : 'text-fg'}`}>{price.amount}</span>
                <span className="text-sm text-muted">{price.cadence}</span>
              </p>
              <p className="mt-1 h-4 text-xs text-muted">{price.note}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.highlights.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-7">{action(plan, interval)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
