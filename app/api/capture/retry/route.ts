import { NextRequest } from 'next/server';
import { getJob, updateResult } from '@/lib/jobStore';
import { captureScreenshots } from '@/lib/screenshot';
import type { CaptureResult } from '@/lib/jobStore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, url, device } = body as { jobId: string; url: string; device?: string };

    if (!jobId || !url) {
      return Response.json(
        { error: 'jobId and url are required' },
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

    if (!job.settings) {
      return Response.json(
        { error: 'Job has no capture settings' },
        { status: 400 }
      );
    }

    let resultKey = url;
    let result = job.results.get(resultKey);
    if (!result && device) {
      resultKey = `${device}:${url}`;
      result = job.results.get(resultKey);
    }
    if (!result) {
      for (const [k, v] of job.results.entries()) {
        if (v.url === url && (!device || v.device === device)) {
          resultKey = k;
          result = v;
          break;
        }
      }
    }

    if (!result) {
      return Response.json(
        { error: 'URL not found in this job' },
        { status: 404 }
      );
    }

    if (result.status !== 'failed') {
      return Response.json(
        { error: 'Only failed captures can be retried' },
        { status: 400 }
      );
    }

    // Reset the result counters
    // Decrement failed counter since we're retrying
    job.failed = Math.max(0, job.failed - 1);
    job.completed = Math.max(0, job.completed - 1);

    // Reset status to queued
    updateResult(jobId, resultKey, { status: 'queued', error: undefined, fileName: undefined });

    const retrySettings = result.device
      ? { ...job.settings, devices: [result.device as any], device: result.device as any }
      : job.settings;

    // Start retry asynchronously
    captureScreenshots(
      jobId,
      [url],
      retrySettings,
      (key: string, retryResult: Partial<CaptureResult>) => {
        updateResult(jobId, key, retryResult);
      }
    ).catch((error) => {
      console.error(`Retry capture for ${url} in job ${jobId} failed:`, error);
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Retry error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Retry failed' },
      { status: 500 }
    );
  }
}
