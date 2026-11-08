import { NextRequest, NextResponse } from 'next/server';
import { executeScheduledRun } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
