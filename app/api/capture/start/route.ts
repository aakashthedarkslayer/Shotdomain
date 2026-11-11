import { NextRequest } from 'next/server';
import { createJob, getJob, updateResult } from '@/lib/jobStore';
import { captureScreenshots } from '@/lib/screenshot';
import { currentUserKey } from '@/auth';
import { saveCaptureFromJob } from '@/lib/userData';
import type { CaptureSettings } from '@/lib/jobStore';
import { sanitizeAuth, sanitizeCleanup } from '@/lib/captureOptions';
import { planInfoFor } from '@/lib/billing';
import { checkCapture, limitResponse } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, settings } = body as {
      urls: string[];
      settings: CaptureSettings;
    };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return Response.json(
        { error: 'At least one URL is required' },
        { status: 400 }
      );
    }

    if (!settings) {
      return Response.json(
        { error: 'Capture settings are required' },
        { status: 400 }
      );
    }

    // Validate format
    if (settings.format !== 'png' && settings.format !== 'jpeg') {
      settings.format = 'png';
    }
    settings.cleanup = sanitizeCleanup(settings.cleanup);
    settings.auth = sanitizeAuth(settings.auth);

    const ownerKey = (await currentUserKey()) ?? undefined;
    const denial = checkCapture(await planInfoFor(ownerKey ?? null), urls.length, settings);
    if (denial) return limitResponse(denial);
    const job = await createJob('capture', urls, settings, ownerKey);

    // Start capture asynchronously (don't await)
    captureScreenshots(
      job.id,
      urls,
      settings,
      (url: string, result) => {
        updateResult(job.id, url, result);
      }
    )
      .then(async () => {
        // Keep a copy in the user's history (tmp/ is wiped after 1h).
        const finished = getJob(job.id);
        if (finished?.ownerKey) await saveCaptureFromJob(finished.ownerKey, { ...finished, results: finished.results.values() });
      })
      .catch((error) => {
        console.error(`Capture job ${job.id} failed:`, error);
      });

    return Response.json({ jobId: job.id });
  } catch (error) {
    console.error('Capture start error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to start capture' },
      { status: 500 }
    );
  }
}
