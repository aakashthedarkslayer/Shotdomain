import { NextRequest, NextResponse } from 'next/server';
import { executeScheduledRun } from '@/lib/scheduler';
import { getOwnedSchedule } from '@/lib/scheduleAccess';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!(await getOwnedSchedule(id))) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    const run = await executeScheduledRun(id);
    return NextResponse.json(run);
  } catch (error) {
    console.error('Error executing scheduled run:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute scheduled run' },
      { status: 500 },
    );
  }
}
