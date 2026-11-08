import { NextRequest } from 'next/server';
import { getJob } from '@/lib/jobStore';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');
  const file = request.nextUrl.searchParams.get('file');

  if (!jobId || !file) {
    return Response.json(
      { error: 'jobId and file are required' },
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

  const jobDir = path.resolve(process.cwd(), 'tmp', jobId);
  // Normalize and resolve the requested file path
  const normalizedFile = path.normalize(file).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.resolve(jobDir, normalizedFile);

  // Security check: ensure filePath is strictly inside jobDir
  if (!filePath.startsWith(jobDir + path.sep) && filePath !== jobDir) {
    return Response.json(
      { error: 'Invalid file path' },
      { status: 400 }
    );
  }

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return Response.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Thumbnail error:', error);
    return Response.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
