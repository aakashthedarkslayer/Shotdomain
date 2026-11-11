import { v4 as uuidv4 } from 'uuid';
import type { CleanupOptions, SealedAuth, SiteAuth } from './captureOptions';
import * as fs from 'fs/promises';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobType = 'discover' | 'capture';
export type CaptureStatus = 'queued' | 'capturing' | 'done' | 'failed';

export interface CaptureSettings {
  device?: 'Desktop' | 'Tablet' | 'Mobile (iOS)' | 'Mobile (Android)';
  devices?: Array<'Desktop' | 'Tablet' | 'Mobile (iOS)' | 'Mobile (Android)'>;
  width: number;
  height: number;
  fullPage: boolean;
  format: 'png' | 'jpeg';
  blockAds: boolean;
  useCache: boolean;
  backgroundColor?: string;
  /** Hide banners/elements, click, inject CSS before capture. */
  cleanup?: CleanupOptions;
  /** Login for sites that need one. Sealed (encrypted) when stored in a schedule. */
  auth?: SiteAuth | SealedAuth;
}

export interface CaptureResult {
  url: string;
  device?: string;
  status: CaptureStatus;
  fileName?: string;
  error?: string;
  /** Non-fatal problem, e.g. a click selector that wasn't found. */
  warning?: string;
}

export interface Job {
  id: string;
  type: JobType;
  createdAt: number;
  urls: string[];
  settings?: CaptureSettings;
  results: Map<string, CaptureResult>;
  total: number;
  completed: number;
  failed: number;
  cancelled: boolean;
  /** userKey of whoever started the job; scheduler jobs have none. */
  ownerKey?: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const jobs: Map<string, Job> = new Map();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTmpDir(jobId: string): string {
  return path.join(process.cwd(), 'tmp', jobId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates and stores a new job. For capture jobs, also creates the tmp
 * directory used to store screenshot files.
 */
export async function createJob(
  type: JobType,
  urls: string[],
  settings?: CaptureSettings,
  ownerKey?: string,
): Promise<Job> {
  const id = uuidv4();

  const devices = (settings?.devices && settings.devices.length > 0)
    ? settings.devices
    : (settings?.device ? [settings.device] : ['Desktop']);

  const isMultiDevice = devices.length > 1;
  const results = new Map<string, CaptureResult>();

  for (const dev of devices) {
    for (const url of urls) {
      const key = isMultiDevice ? `${dev}:${url}` : url;
      results.set(key, { url, device: dev, status: 'queued' });
    }
  }

  const total = urls.length * devices.length;

  const job: Job = {
    id,
    type,
    createdAt: Date.now(),
    urls,
    settings,
    results,
    total,
    completed: 0,
    failed: 0,
    cancelled: false,
    ownerKey,
  };

  jobs.set(id, job);

  // Create the tmp directory for capture jobs so workers can write files
  if (type === 'capture') {
    await fs.mkdir(getTmpDir(id), { recursive: true });
  }

  return job;
}

/**
 * Returns the job with the given ID, or `undefined` if it does not exist.
 */
export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

/**
 * Merges `result` into the existing CaptureResult for `key` (or URL) inside the
 * specified job. When the status transitions to `'done'` or `'failed'` the
 * corresponding counter on the job is incremented.
 */
export function updateResult(
  jobId: string,
  key: string,
  result: Partial<CaptureResult>,
): void {
  const job = jobs.get(jobId);
  if (!job) return;

  let existingKey = key;
  let existing = job.results.get(key);
  if (!existing) {
    for (const [k, v] of job.results.entries()) {
      if (k === key || v.url === key) {
        existingKey = k;
        existing = v;
        break;
      }
    }
  }
  if (!existing) return;

  const previousStatus = existing.status;
  const updated: CaptureResult = { ...existing, ...result };
  job.results.set(existingKey, updated);

  // Increment counters only on first transition into a terminal state
  if (previousStatus !== 'done' && updated.status === 'done') {
    job.completed += 1;
  }
  if (previousStatus !== 'failed' && updated.status === 'failed') {
    job.failed += 1;
  }
}

/**
 * Removes a job from the store and recursively deletes its tmp directory.
 */
export async function deleteJob(jobId: string): Promise<void> {
  jobs.delete(jobId);

  try {
    await fs.rm(getTmpDir(jobId), { recursive: true, force: true });
  } catch {
    // Directory may not exist; ignore errors.
  }
}

/**
 * Deletes every job whose `createdAt` timestamp is older than 1 hour.
 */
export async function cleanupOldJobs(): Promise<void> {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  const deletions: Promise<void>[] = [];
  for (const [id, job] of jobs) {
    if (job.createdAt < oneHourAgo) {
      deletions.push(deleteJob(id));
    }
  }

  await Promise.all(deletions);
}

// ---------------------------------------------------------------------------
// Auto-cleanup (disabled during tests)
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupOldJobs, 5 * 60 * 1000);
}
