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
  const s = PLANS.pro.price;
  const months = s.month && s.year ? Math.round(12 - s.year / s.month) : 0;
  return months > 0 ? `${months} months free` : '';
}

export function IntervalToggle({ value, onChange }: { value: Interval; onChange: (v: Interval) => void }) {
  const saving = yearlySaving();
  return (
    <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-md border border-line-strong bg-surface p-1 text-sm">
      {(['month', 'year'] as const).map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className={`flex cursor-pointer items-center gap-2 rounded-[4px] px-4 py-1.5 font-semibold transition-colors ${
            value === i ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg'
          }`}
        >
          {i === 'month' ? 'Monthly' : 'Yearly'}
          {i === 'year' && saving && (
            <span className={`text-xs font-semibold ${value === i ? 'opacity-80' : 'text-fg'}`}>{saving}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * The plan cards: flat prints on the sheet (DESIGN.md). The featured tier is
 * a piece of film (ink-flip), so its primary button turns into the paper
 * button on black. `action` renders each card's button (a link on the
 * homepage, checkout / switch buttons on the billing page).
 */
export function PricingCards({
  action,
  highlight,
  current,
  initialInterval = 'month',
}: {
  action: (plan: Plan, interval: Interval) => ReactNode;
  /** Card to emphasise (default: Pro). */
  highlight?: PlanId;
  /** The user's current plan, marked on its card. */
  current?: PlanId;
  initialInterval?: Interval;
}) {
  const [interval, setPeriod] = useState<Interval>(initialInterval);
  return (
    <div className="space-y-10">
      <div className="flex justify-center">
        <IntervalToggle value={interval} onChange={setPeriod} />
      </div>
      <div className="mx-auto grid max-w-5xl items-stretch gap-4 md:grid-cols-3">
        {PRICING_ORDER.map((id) => {
          const plan = PLANS[id];
          const featured = (highlight ?? 'pro') === id;
          const price = priceLabel(plan, interval);
          const label = current === id ? 'Your plan' : plan.badge;
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-none p-8 ${featured ? 'ink-flip' : 'card-strong'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="type-head text-2xl font-black tracking-[-0.02em] text-fg">{plan.name}</h3>
                {label && (
                  <span
                    className={`rounded-none border px-1.5 py-0.5 text-xs font-semibold ${
                      current === id ? 'border-accent bg-accent-soft text-accent-text' : 'border-line-strong text-muted'
                    }`}
                  >
                    {label}
                  </span>
                )}
              </div>
              <p className="mt-2 min-h-[2.5rem] text-sm leading-5 text-muted">{plan.tagline}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="type-head text-5xl font-black tracking-[-0.03em] text-fg tabular-nums">{price.amount}</span>
                <span className="text-sm text-muted">{price.cadence}</span>
              </p>
              <p className="mt-1 h-4 text-xs text-faint">{price.note}</p>
              <ul className="mt-8 flex-1 space-y-3 border-t border-line pt-6">
                {plan.highlights.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm leading-5 text-fg">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-muted" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">{action(plan, interval)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
