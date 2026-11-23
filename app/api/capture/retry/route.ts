import { NextRequest } from 'next/server';
import { getJob, updateResult } from '@/lib/jobStore';
import { getOwnedJob } from '@/lib/jobAccess';
import { refreshSharedCapture } from '@/lib/shareStore';
import { captureScreenshots } from '@/lib/screenshot';
import type { CaptureResult, CaptureSettings } from '@/lib/jobStore';
import * as path from 'path';

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

    const job = await getOwnedJob(jobId);
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

    // It's leaving the failed state; `completed` was never counted for it.
    job.failed = Math.max(0, job.failed - 1);
    updateResult(jobId, resultKey, { status: 'queued', error: undefined, fileName: undefined });

    const retryDevice = result.device as NonNullable<CaptureSettings['devices']>[number] | undefined;
    const retrySettings: CaptureSettings = retryDevice ? { ...job.settings, devices: [retryDevice], device: retryDevice } : job.settings;
    // A multi-device job keeps its per-device folders and "Device:url" keys; a
    // retried page must never take the file name of a page that succeeded.
    const multiDevice = (job.settings.devices?.length ?? 0) > 1;
    const reservedNames = Array.from(job.results.values())
      .filter((r) => r.fileName && r.device === result.device)
      .map((r) => path.basename(r.fileName!));

    // Start retry asynchronously
    captureScreenshots(
      jobId,
      [url],
      retrySettings,
      (key: string, retryResult: Partial<CaptureResult>) => {
        updateResult(jobId, key, retryResult);
      },
      { deviceFolders: multiDevice, reservedNames },
    )
      .then(async () => {
        // If this capture is shared, update the shared copy so it includes the retried screenshot.
        const latest = getJob(jobId);
        if (latest) await refreshSharedCapture({ ...latest, results: latest.results.values() });
      })
      .catch((error) => {
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
