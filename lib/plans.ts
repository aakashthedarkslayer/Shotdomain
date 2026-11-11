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
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Try the full workflow on smaller sites.',
    price: { month: 0, year: 0 },
    limits: {
      pagesPerRun: 15,
      devices: ['Desktop'],
      loginPages: false,
      schedules: 0,
      pagesPerSchedule: 0,
      frequencies: [],
      runsKept: 0,
      historyKept: 10,
    },
    highlights: ['Up to 15 pages per capture', 'Desktop screenshots', 'Sitemap + crawl discovery', 'ZIP download and share links', 'Last 10 captures kept', 'No watermark'],
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    tagline: 'For freelancers, designers and QA who track sites every week.',
    price: { month: 9, year: 90 },
    limits: STUDIO_LIMITS,
    badge: 'Most popular',
    highlights: [
      'Up to 150 pages per capture',
      'All 4 devices, high-DPI',
      'Capture pages behind a login',
      '5 schedules · 25 key pages each',
      'Daily, weekly or monthly runs',
      'Change alerts by email',
      'Last 100 captures kept',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    tagline: 'For teams monitoring many client sites.',
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
    },
    highlights: [
      'Up to 500 pages per capture',
      'Everything in Studio',
      '25 schedules · 100 pages each',
      'Whole-site archives',
      'Last 30 runs per schedule',
      'Last 500 captures kept',
    ],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    tagline: 'Studio, paid once. Early-supporter offer.',
    price: { once: 99 },
    limits: STUDIO_LIMITS,
    highlights: ['Everything in Studio, forever', 'One payment, no renewals', 'All future updates to Studio features'],
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
