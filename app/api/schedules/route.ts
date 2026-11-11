import { NextRequest, NextResponse } from 'next/server';
import { createSchedule } from '@/lib/scheduleStore';
import { initScheduler, registerScheduleCron } from '@/lib/scheduler';
import { listOwnedSchedules, publicSchedule } from '@/lib/scheduleAccess';
import { sanitizeAuth, sanitizeCleanup } from '@/lib/captureOptions';
import { seal } from '@/lib/secretBox';
import { currentUserKey } from '@/auth';
import { planInfoFor } from '@/lib/billing';
import { checkNewSchedule, limitResponse } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

function clampThreshold(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0.1, n)) : 1;
}

export async function GET() {
  await initScheduler();
  return NextResponse.json((await listOwnedSchedules()).map(publicSchedule));
}

export async function POST(request: NextRequest) {
  try {
    await initScheduler();
    const ownerKey = await currentUserKey();
    if (!ownerKey) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const body = await request.json();

    const {
      name,
      targetUrl,
      urls,
      settings,
      frequency,
      timeOfDay,
      dayOfWeek,
      dayOfMonth,
      enabled = true,
      recipients = [],
      retentionCount = 10,
      notifyOn,
      changeThreshold,
    } = body;

    if (!name || !targetUrl || !urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Name, targetUrl, and at least one URL are required' },
        { status: 400 },
      );
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Frequency must be daily, weekly, or monthly' },
        { status: 400 },
      );
    }

    const info = await planInfoFor(ownerKey);
    const denial = checkNewSchedule(info, (await listOwnedSchedules()).length, urls.length, frequency, settings);
    if (denial) return limitResponse(denial);

    // Login secrets are stored encrypted; cleanup options are sanitized like captures.
    if (settings) {
      settings.cleanup = sanitizeCleanup(settings.cleanup);
      const auth = sanitizeAuth(settings.auth);
      settings.auth = auth ? { method: auth.method, sealed: seal(auth) } : undefined;
    }

    const schedule = await createSchedule({
      name,
      targetUrl,
      urls,
      settings,
      frequency,
      timeOfDay: timeOfDay || '09:00',
      dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : 1,
      dayOfMonth: dayOfMonth !== undefined ? Number(dayOfMonth) : 1,
      enabled,
      recipients: Array.isArray(recipients) ? recipients : [],
      retentionCount: Math.min(Number(retentionCount) || 10, info.limits.runsKept),
      ownerKey,
      notifyOn: notifyOn === 'changes' ? 'changes' : 'every',
      changeThreshold: clampThreshold(changeThreshold),
    });

    // Register with active background scheduler
    if (schedule.enabled) {
      registerScheduleCron(schedule);
    }

    return NextResponse.json(publicSchedule(schedule), { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create schedule' },
      { status: 500 },
    );
  }
}
