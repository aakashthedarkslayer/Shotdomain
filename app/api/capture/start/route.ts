import { NextRequest } from 'next/server';
import { createJob, getJob } from '@/lib/jobStore';
import { captureScreenshots } from '@/lib/screenshot';
import { updateResult } from '@/lib/jobStore';
import type { CaptureSettings } from '@/lib/jobStore';

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

    const job = await createJob('capture', urls, settings);

    // Start capture asynchronously (don't await)
    captureScreenshots(
      job.id,
      urls,
      settings,
      (url: string, result) => {
        updateResult(job.id, url, result);
      }
    ).catch((error) => {
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
