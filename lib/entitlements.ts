import { currentUserKey } from '@/auth';
import { planInfoFor } from './billing';
import { PLANS, cheapestPlanWith } from './plans';
import type { DeviceName, PlanInfo, PlanLimits } from './plans';

/**
 * Plan limit checks used by the API routes. Each returns
 * null when allowed, or a message saying what the plan allows and which plan
 * unlocks more. Without billing configured, everything is allowed.
 */

export interface LimitDenial {
  error: string;
  /** Tells the UI to show an "Upgrade" link. */
  upgrade: true;
}

/** `more`: the limit is a number ("…for more"), not a feature ("…to unlock it"). */
function deny(info: PlanInfo, what: string, test: (l: PlanLimits) => boolean, more = false): LimitDenial {
  const next = cheapestPlanWith(test);
  const plan = PLANS[info.plan].name;
  const tail = next ? ` Upgrade to ${next.name} ${more ? 'for more' : 'to unlock it'}.` : '';
  return { error: `${what} on the ${plan} plan.${tail}`, upgrade: true };
}

/** JSON 402 response for a denial. */
export function limitResponse(d: LimitDenial) {
  return Response.json(d, { status: 402 });
}

export async function currentPlanInfo(): Promise<PlanInfo> {
  return planInfoFor(await currentUserKey());
}

interface CaptureLike {
  device?: string;
  devices?: string[];
  auth?: unknown;
}

function devicesOf(settings: CaptureLike | undefined): string[] {
  return settings?.devices?.length ? settings.devices : [settings?.device ?? 'Desktop'];
}

export function checkLoginPages(info: PlanInfo): LimitDenial | null {
  if (info.limits.loginPages) return null;
  return deny(info, 'Capturing pages behind a login isn’t included', (l) => l.loginPages);
}

export function checkDevices(info: PlanInfo, settings: CaptureLike | undefined): LimitDenial | null {
  const blocked = devicesOf(settings).filter((d) => !info.limits.devices.includes(d as DeviceName));
  if (blocked.length === 0) return null;
  return deny(info, `${blocked.join(', ')} screenshots aren’t included`, (l) =>
    blocked.every((d) => l.devices.includes(d as DeviceName)),
  );
}

/** One-off capture. */
export function checkCapture(info: PlanInfo, pageCount: number, settings: CaptureLike | undefined): LimitDenial | null {
  if (pageCount > info.limits.pagesPerRun) {
    return deny(info, `You can capture up to ${info.limits.pagesPerRun} pages at a time`, (l) => l.pagesPerRun >= pageCount, true);
  }
  return checkDevices(info, settings) ?? (settings?.auth ? checkLoginPages(info) : null);
}

/** Turning on another share link (active = links the user has now). */
export function checkShareLinks(info: PlanInfo, active: number): LimitDenial | null {
  if (active < info.limits.shareLinks) return null;
  const d = deny(info, `You can have up to ${info.limits.shareLinks} share links at a time`, (l) => l.shareLinks > active, true);
  return { ...d, error: `${d.error} Or stop sharing an older link on your profile page.` };
}
