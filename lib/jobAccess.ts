import { authEnabled, currentUserKey } from '@/auth';
import { getJob } from '@/lib/jobStore';
import type { Job } from '@/lib/jobStore';

/**
 * The job, if it exists and the current user started it. In local mode
 * (no sign-in) every job is accessible, as before.
 */
export async function getOwnedJob(jobId: string | null | undefined): Promise<Job | undefined> {
  if (!jobId) return undefined;
  const job = getJob(jobId);
  if (!job || !authEnabled) return job;
  const key = await currentUserKey();
  return key && job.ownerKey === key ? job : undefined;
}
