import { authEnabled, currentUserKey } from '@/auth';
import { LOCAL_USER_KEY } from '@/lib/userData';
import { getSchedule, getSchedules, isValidId } from '@/lib/scheduleStore';
import type { Schedule } from '@/lib/scheduleStore';

/**
 * Schedules are private to whoever created them.
 * - Signed-in mode: only schedules whose ownerKey matches the user.
 * - Local mode: the local user's schedules plus any created before
 *   schedules had owners (so existing local setups keep working).
 */
function visibleTo(schedule: Schedule, userKey: string): boolean {
  if (schedule.ownerKey === userKey) return true;
  return !authEnabled && userKey === LOCAL_USER_KEY && !schedule.ownerKey;
}

export async function listOwnedSchedules(): Promise<Schedule[]> {
  const key = await currentUserKey();
  if (!key) return [];
  return (await getSchedules()).filter((s) => visibleTo(s, key));
}

/** The schedule if the current user may see it, otherwise null (callers respond 404). */
export async function getOwnedSchedule(id: string): Promise<Schedule | null> {
  if (!isValidId(id)) return null;
  const key = await currentUserKey();
  if (!key) return null;
  const schedule = await getSchedule(id);
  return schedule && visibleTo(schedule, key) ? schedule : null;
}

/** Schedule as returned to the browser: saved login secrets are never sent back. */
export function publicSchedule(schedule: Schedule): Schedule {
  const auth = schedule.settings?.auth;
  if (!auth) return schedule;
  return { ...schedule, settings: { ...schedule.settings, auth: { method: auth.method, sealed: '' } } };
}
