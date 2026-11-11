import { NextRequest } from 'next/server';
import { getOwnedJob } from '@/lib/jobAccess';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body as { jobId: string };

    if (!jobId) {
      return Response.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    const job = await getOwnedJob(jobId);
    if (!job) {
      return Response.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    job.cancelled = true;

    return Response.json({ success: true, cancelled: true });
  } catch (error) {
    console.error('Cancel error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
