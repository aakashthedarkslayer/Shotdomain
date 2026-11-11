/**
 * Details the legal pages (/terms, /privacy, /refunds) fill in. Replace the
 * bracketed values before going live: until then each page shows a "draft"
 * banner. Paddle checks these pages during its account review.
 */
export const LEGAL = {
  product: 'ShotDomain',
  /** Registered business name, or your full name if you trade as an individual. */
  company: '[Your legal business name]',
  /** Postal address of the business (Paddle and privacy laws ask for one). */
  address: '[Business address, city, country]',
  /** Where users send support, refund and privacy requests. */
  email: '[support@yourdomain.com]',
  /** Website address. */
  website: '[https://yourdomain.com]',
  /** Courts and law that govern the Terms, e.g. "India" with courts in "Mumbai, Maharashtra". */
  governingLaw: '[Country]',
  courts: '[City, State]',
  /** Last update of these pages. */
  updated: '11 November 2026',
  /** Money-back window for any payment, in days. */
  refundDays: 14,
};

/** True while any placeholder above is still unfilled. */
export const legalIsDraft = Object.values(LEGAL).some((v) => typeof v === 'string' && /^\[.*\]$/.test(v));
