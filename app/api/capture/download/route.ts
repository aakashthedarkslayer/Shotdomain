import { NextRequest } from 'next/server';
import { getOwnedJob } from '@/lib/jobAccess';
import { createZipStream } from '@/lib/zip';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');

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

  try {
    const { stream, fileCount } = await createZipStream(jobId);

    if (fileCount === 0) {
      return Response.json(
        { error: 'No screenshots available for download' },
        { status: 404 }
      );
    }

    // Convert archiver stream to a ReadableStream for the Web Response API
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        stream.on('end', () => {
          controller.close();
        });
        stream.on('error', (err: Error) => {
          controller.error(err);
        });
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="screenshots-${jobId.slice(0, 8)}.zip"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}
