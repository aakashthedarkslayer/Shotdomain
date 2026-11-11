'use client';

import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { PricingCards } from './PricingCards';

/** Homepage pricing: paid plans go to checkout on the billing page (sign-in first if needed). */
export function MarketingPricing({ billingEnabled }: { billingEnabled: boolean }) {
  return (
    <PricingCards
      action={(plan, interval) => {
        const paid = plan.id !== 'free';
        const href =
          paid && billingEnabled ? `/billing?plan=${plan.id}&interval=${plan.id === 'lifetime' ? 'once' : interval}&checkout=1` : '/app';
        return (
          <Link href={href} className={buttonClass(plan.badge ? 'primary' : 'secondary', 'md', 'w-full')}>
            {paid ? `Get ${plan.name}` : 'Start free'}
          </Link>
        );
      }}
    />
  );
}
