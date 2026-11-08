import { NextRequest, NextResponse } from 'next/server';
import {
  getSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduledRuns,
} from '@/lib/scheduleStore';
import { registerScheduleCron, stopScheduleCron } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const schedule = await getSchedule(id);

  if (!schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  const runs = await getScheduledRuns(id);
  return NextResponse.json({ schedule, runs });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateSchedule(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Update in-memory scheduler
    if (updated.enabled) {
      registerScheduleCron(updated);
    } else {
      stopScheduleCron(id);
    }

    return NextResponse.json(updated);
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
