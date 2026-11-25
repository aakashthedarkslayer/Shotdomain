import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { Icon } from '@/components/ui/Icon';
import { buttonClass } from '@/components/ui/Button';
import type { PlanId } from '@/lib/plans';
import { PLANS } from '@/lib/plans';

/** Small "Pro" chip with a lock icon, linking to the billing page (plain chip inside other controls). */
export function PlanLock({ plan = 'pro', className = '', link = true }: { plan?: PlanId; className?: string; link?: boolean }) {
  if (!link) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-sm border border-line-strong bg-surface px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-fg ${className}`}>
        <Icon name="lock" size={11} /> {PLANS[plan].name}
      </span>
    );
  }
  return (
    <Link
      href={`/billing?plan=${plan}`}
      className={`inline-flex items-center gap-1 rounded-sm border border-line-strong bg-surface px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-fg hover:underline ${className}`}
    >
      <Icon name="lock" size={11} /> {PLANS[plan].name}
    </Link>
  );
}

/** An error from the API; plan-limit errors ("… Upgrade to X …") get a "See plans" button. */
export function LimitAwareError({ message }: { message: string }) {
  const upgrade = /Upgrade to (\w+)/.exec(message);
  const plan = upgrade?.[1]?.toLowerCase() as PlanId | undefined;
  if (!upgrade) return <Alert tone="danger">{message}</Alert>;
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-line-strong bg-subtle px-4 py-3 text-sm sm:flex-row sm:items-center">
      <Icon name="lock" size={16} className="shrink-0 text-fg" />
      <span className="flex-1 text-fg">{message}</span>
      <Link href={`/billing${plan && plan in PLANS ? `?plan=${plan}` : ''}`} className={buttonClass('primary', 'sm', 'shrink-0')}>
        See plans
      </Link>
    </div>
  );
}
