/**
 * Plans, prices and what each plan allows. The single place to change
 * pricing: the homepage, the billing page and every limit check read this.
 * Client-safe (no secrets). Paddle price IDs live in env vars (lib/billing.ts).
 */

export type PlanId = 'free' | 'pro' | 'lifetime';
export type Interval = 'month' | 'year';
export type DeviceName = 'Desktop' | 'Tablet' | 'Mobile (iOS)' | 'Mobile (Android)';

export interface PlanLimits {
  /** Pages in one capture. */
  pagesPerRun: number;
  devices: DeviceName[];
  /** Capture pages behind a login (session cookies, cURL, passwords). */
  loginPages: boolean;
  /** Share links active at once (each keeps its capture for SHARE_DAYS). */
  shareLinks: number;
  /** Your own name and logo on share links, instead of ShotDomain's. */
  branding: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** USD. `year` = price for 12 months. Lifetime uses `once`. */
  price: { month?: number; year?: number; once?: number };
  limits: PlanLimits;
  /** Shown on the pricing cards, in order. */
  highlights: string[];
  badge?: string;
}

/** Lifetime is a capped founding batch: once this many are sold it's gone. */
export const LIFETIME_CAP = 100;

/** A share link (and the screenshots it shows) lasts this many days. */
export const SHARE_DAYS = 30;

const ALL_DEVICES: DeviceName[] = ['Desktop', 'Tablet', 'Mobile (iOS)', 'Mobile (Android)'];

const PRO_LIMITS: PlanLimits = {
  pagesPerRun: 500,
  devices: ALL_DEVICES,
  loginPages: true,
  shareLinks: 25,
  branding: true,
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'A whole small site on desktop and iPhone, free.',
    price: { month: 0, year: 0 },
    limits: {
      pagesPerRun: 15,
      // Desktop + one phone, so the free plan shows what ShotDomain is for.
      devices: ['Desktop', 'Mobile (iOS)'],
      loginPages: false,
      shareLinks: 3,
      branding: false,
    },
    highlights: [
      'Up to 15 pages per capture',
      'Desktop and iPhone screenshots',
      'Finds every page automatically',
      'ZIP download',
      `3 share links, ${SHARE_DAYS} days each`,
      'Clean screenshots, no watermark',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Every page of any site, on every device.',
    price: { month: 5, year: 48 },
    limits: PRO_LIMITS,
    badge: 'Most popular',
    highlights: [
      'Up to 500 pages per capture',
      'Desktop, tablet, iPhone and Android',
      'Capture pages behind a login',
      `25 share links, ${SHARE_DAYS} days each`,
      'Your logo and name on share links',
      'Everything in Free',
    ],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    tagline: `Pro, paid once. Founding batch: the first ${LIFETIME_CAP} buyers only.`,
    price: { once: 39 },
    limits: PRO_LIMITS,
    highlights: ['Everything in Pro, for good', 'One payment, no renewals', 'All future updates to Pro features', `Capped at ${LIFETIME_CAP}, then it’s gone`],
  },
};

/** Plans shown as pricing cards, in order. */
export const PRICING_ORDER: PlanId[] = ['free', 'pro', 'lifetime'];

/** No limits: used when billing isn't configured (self-hosted / local mode). */
export const UNLIMITED: PlanLimits = {
  pagesPerRun: 500,
  devices: ALL_DEVICES,
  loginPages: true,
  shareLinks: 100,
  branding: true,
};

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === 'string' && v in PLANS;
}

/** The plan to suggest in "Upgrade to X" prompts, if it allows the thing. */
export function cheapestPlanWith(test: (l: PlanLimits) => boolean): Plan | undefined {
  return test(PLANS.pro.limits) ? PLANS.pro : undefined;
}

/** What the client needs to know about the user's plan (passed through context). */
export interface PlanInfo {
  /** False when billing isn't set up: everything is allowed. */
  billingEnabled: boolean;
  plan: PlanId;
  limits: PlanLimits;
}
