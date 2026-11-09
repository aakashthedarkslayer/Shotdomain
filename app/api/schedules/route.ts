import { NextRequest, NextResponse } from 'next/server';
import { createSchedule } from '@/lib/scheduleStore';
import { initScheduler, registerScheduleCron } from '@/lib/scheduler';
import { listOwnedSchedules } from '@/lib/scheduleAccess';
import { currentUserKey } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  await initScheduler();
  return NextResponse.json(await listOwnedSchedules());
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
      retentionCount: Number(retentionCount) || 10,
      ownerKey,
    });

    // Register with active background scheduler
    if (schedule.enabled) {
      registerScheduleCron(schedule);
    }

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create schedule' },
      { status: 500 },
    );
  }
}
