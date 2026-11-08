import { NextRequest } from 'next/server';
import { getJob } from '@/lib/jobStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');

  if (!jobId) {
    return Response.json(
      { error: 'jobId is required' },
      { status: 400 }
    );
  }

  const job = getJob(jobId);
  if (!job) {
    return Response.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  const results = Array.from(job.results.values());

  return Response.json({
    total: job.total,
    completed: job.completed,
    failed: job.failed,
    cancelled: job.cancelled,
    results,
  });
}
