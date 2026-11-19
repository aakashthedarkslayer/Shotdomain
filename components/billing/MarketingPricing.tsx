'use client';

import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { PricingCards } from './PricingCards';
import { LifetimeStock } from './LifetimeStock';

/** Homepage pricing: paid plans go to checkout on the billing page (sign-in first if needed). */
export function MarketingPricing({ billingEnabled, lifetimeLeft }: { billingEnabled: boolean; lifetimeLeft: number }) {
  return (
    <PricingCards
      action={(plan, interval) => {
        const paid = plan.id !== 'free';
        if (plan.id === 'lifetime' && lifetimeLeft <= 0) {
          return (
            <>
              <LifetimeStock left={0} />
              <span className={buttonClass('secondary', 'md', 'w-full pointer-events-none opacity-60')}>Sold out</span>
            </>
          );
        }
        const href =
          paid && billingEnabled ? `/billing?plan=${plan.id}&interval=${plan.id === 'lifetime' ? 'once' : interval}&checkout=1` : '/app';
        return (
          <>
            {plan.id === 'lifetime' && <LifetimeStock left={lifetimeLeft} />}
            <Link href={href} className={buttonClass(plan.badge ? 'primary' : 'secondary', 'md', 'w-full')}>
              {paid ? `Get ${plan.name}` : 'Start free'}
            </Link>
          </>
        );
      }}
    />
  );
}
