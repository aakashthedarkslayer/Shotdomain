import { LIFETIME_CAP } from '@/lib/plans';

/** "37 of 100 founding licences left" above the Lifetime button. Real numbers only: no fake scarcity. */
export function LifetimeStock({ left }: { left: number }) {
  return (
    <p className={`mb-2 text-center text-xs font-medium ${left <= 0 ? 'text-danger' : left <= 20 ? 'text-warning' : 'text-muted'}`}>
      {left <= 0 ? `All ${LIFETIME_CAP} founding licences are sold` : `${left} of ${LIFETIME_CAP} founding licences left`}
    </p>
  );
}
