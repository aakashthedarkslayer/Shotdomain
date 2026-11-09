import { NextRequest, NextResponse } from 'next/server';
import { updateSchedule, deleteSchedule, getScheduledRuns } from '@/lib/scheduleStore';
import type { Schedule } from '@/lib/scheduleStore';
import { getOwnedSchedule, publicSchedule } from '@/lib/scheduleAccess';
import { registerScheduleCron, stopScheduleCron } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const schedule = await getOwnedSchedule(id);

  if (!schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  const runs = await getScheduledRuns(id);
  return NextResponse.json({ schedule: publicSchedule(schedule), runs });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!(await getOwnedSchedule(id))) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    const body = await request.json();

    // Only user-editable fields; owner, cron expression and run state are server-managed.
    const changes: Partial<Schedule> = {};
    if (typeof body.enabled === 'boolean') changes.enabled = body.enabled;
    if (typeof body.name === 'string' && body.name.trim()) changes.name = body.name.trim().slice(0, 120);

    const updated = await updateSchedule(id, changes);
    if (!updated) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Update in-memory scheduler
    if (updated.enabled) {
      registerScheduleCron(updated);
    } else {
      stopScheduleCron(id);
    }

    return NextResponse.json(publicSchedule(updated));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update schedule' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!(await getOwnedSchedule(id))) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    stopScheduleCron(id);
    const success = await deleteSchedule(id);

    if (!success) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete schedule' },
      { status: 500 },
    );
  }
}
