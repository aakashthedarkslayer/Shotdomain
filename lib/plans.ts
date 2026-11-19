/**
 * Plans, prices and what each plan allows. The single place to change
 * pricing: the homepage, the billing page and every limit check read this.
 * Client-safe (no secrets). Paddle price IDs live in env vars (lib/billing.ts).
 */

export type PlanId = 'free' | 'studio' | 'agency' | 'lifetime';
export type Interval = 'month' | 'year';
export type DeviceName = 'Desktop' | 'Tablet' | 'Mobile (iOS)' | 'Mobile (Android)';
export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface PlanLimits {
  /** Pages in one capture (one-off). */
  pagesPerRun: number;
  devices: DeviceName[];
  /** Capture pages behind a login (session cookies, cURL, passwords). */
  loginPages: boolean;
  /** Active schedules. 0 = schedules not included. */
  schedules: number;
  /** Pages one schedule may monitor. */
  pagesPerSchedule: number;
  frequencies: Frequency[];
  /** Runs kept per schedule. */
  runsKept: number;
  /** Captures kept in history. */
  historyKept: number;
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

const ALL_DEVICES: DeviceName[] = ['Desktop', 'Tablet', 'Mobile (iOS)', 'Mobile (Android)'];

const STUDIO_LIMITS: PlanLimits = {
  pagesPerRun: 150,
  devices: ALL_DEVICES,
  loginPages: true,
  schedules: 5,
  pagesPerSchedule: 25,
  frequencies: ['daily', 'weekly', 'monthly'],
  runsKept: 10,
  historyKept: 100,
  branding: false,
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'See a whole small site on desktop and iPhone, free.',
    price: { month: 0, year: 0 },
    limits: {
      pagesPerRun: 15,
      // Desktop + one phone, so the free plan shows what ShotDomain is for.
      devices: ['Desktop', 'Mobile (iOS)'],
      loginPages: false,
      schedules: 0,
      pagesPerSchedule: 0,
      frequencies: [],
      runsKept: 0,
      historyKept: 10,
      branding: false,
    },
    highlights: ['Up to 15 pages per capture', 'Desktop and iPhone screenshots', 'Finds every page automatically', 'ZIP download and share links', 'Last 10 captures kept', 'Clean screenshots, no watermark'],
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    tagline: 'A dated record of up to 5 client sites, kept for you.',
    price: { month: 9, year: 90 },
    limits: STUDIO_LIMITS,
    badge: 'Most popular',
    highlights: [
      '5 client sites monitored · 25 key pages each',
      'Daily, weekly or monthly runs, every one kept',
      'Change alerts that ignore banners and animations',
      'All 4 devices, high-DPI',
      'Capture pages behind a login',
      'Up to 150 pages per one-off capture',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    tagline: 'For agencies: client-ready history of every site you look after.',
    price: { month: 29, year: 290 },
    limits: {
      pagesPerRun: 500,
      devices: ALL_DEVICES,
      loginPages: true,
      schedules: 25,
      pagesPerSchedule: 100,
      frequencies: ['daily', 'weekly', 'monthly'],
      runsKept: 30,
      historyKept: 500,
      branding: true,
    },
    highlights: [
      '25 client sites monitored · 100 pages each',
      'Share links with your logo and name',
      'Before/after compare your clients can open',
      'Last 30 runs per site, 500 captures kept',
      'Up to 500 pages per one-off capture',
      'Everything in Studio',
    ],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    tagline: `Studio, paid once. Founding batch: the first ${LIFETIME_CAP} buyers only.`,
    price: { once: 79 },
    limits: STUDIO_LIMITS,
    highlights: ['Everything in Studio, forever', 'One payment, no renewals', 'All future updates to Studio features', `Capped at ${LIFETIME_CAP} — then it’s gone`],
  },
};

/** Plans shown as pricing cards, in order. */
export const PRICING_ORDER: PlanId[] = ['free', 'studio', 'agency', 'lifetime'];

export const PAID_PLANS: PlanId[] = ['studio', 'agency', 'lifetime'];

/** No limits: used when billing isn't configured (self-hosted / local mode). */
export const UNLIMITED: PlanLimits = {
  pagesPerRun: 500,
  devices: ALL_DEVICES,
  loginPages: true,
  schedules: 1000,
  pagesPerSchedule: 500,
  frequencies: ['daily', 'weekly', 'monthly'],
  runsKept: 30,
  historyKept: 500,
  branding: true,
};

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === 'string' && v in PLANS;
}

/** The cheapest plan that allows something — for "Upgrade to X" prompts. */
export function cheapestPlanWith(test: (l: PlanLimits) => boolean): Plan | undefined {
  return (['studio', 'agency'] as PlanId[]).map((id) => PLANS[id]).find((p) => test(p.limits));
}

/** What the client needs to know about the user's plan (passed through context). */
export interface PlanInfo {
  /** False when billing isn't set up: everything is allowed. */
  billingEnabled: boolean;
  plan: PlanId;
  limits: PlanLimits;
}
