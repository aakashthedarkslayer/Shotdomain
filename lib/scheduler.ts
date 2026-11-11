import cron, { type ScheduledTask } from 'node-cron';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  getSchedules,
  getSchedule,
  recordScheduledRun,
  getRunDir,
  getScheduledRuns,
  type Schedule,
  type ScheduledRun,
  type ScheduledRunResult,
} from './scheduleStore';
import { createJob, getJob, updateResult } from './jobStore';
import { saveCaptureFromJob } from './userData';
import { unseal } from './secretBox';
import type { SiteAuth } from './captureOptions';
import type { CaptureSettings } from './jobStore';
import { captureScreenshots } from './screenshot';
import { createZipFile } from './zip';
import { percentChanged } from './imageDiff';
import { sendScheduledRunEmail } from './email';
import { planInfoFor } from './billing';
import { checkScheduledRun } from './entitlements';

/** A run that the owner's plan doesn't allow (e.g. after a downgrade). */
export class PlanLimitError extends Error {}

// Global registry of active cron tasks
const activeCronTasks = new Map<string, ScheduledTask>();
let isInitialized = false;

/**
 * Register a cron task for a given schedule
 */
export function registerScheduleCron(schedule: Schedule): void {
  // Stop existing cron if any
  stopScheduleCron(schedule.id);

  if (!schedule.enabled) {
    return;
  }

  // Validate cron expression
  if (!cron.validate(schedule.cronExpression)) {
    console.error(
      `[Scheduler] Invalid cron expression for schedule ${schedule.id}: ${schedule.cronExpression}`,
    );
    return;
  }

  console.log(
    `[Scheduler] Registering cron for "${schedule.name}" (${schedule.id}) with pattern "${schedule.cronExpression}"`,
  );

  const task = cron.schedule(schedule.cronExpression, async () => {
    console.log(`[Scheduler] Cron triggered for schedule: "${schedule.name}"`);
    try {
      await executeScheduledRun(schedule.id);
    } catch (err) {
      console.error(
        `[Scheduler] Error running scheduled job ${schedule.id}:`,
        err,
      );
    }
  });

  activeCronTasks.set(schedule.id, task);
}

/**
 * Stop and deregister a cron task for a schedule
 */
export function stopScheduleCron(scheduleId: string): void {
  const existing = activeCronTasks.get(scheduleId);
  if (existing) {
    existing.stop();
    activeCronTasks.delete(scheduleId);
    console.log(`[Scheduler] Stopped cron task for schedule ${scheduleId}`);
  }
}

/**
 * Initialize the scheduler daemon on startup/first load
 */
export async function initScheduler(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const schedules = await getSchedules();
    let registeredCount = 0;

    for (const schedule of schedules) {
      if (schedule.enabled) {
        registerScheduleCron(schedule);
        registeredCount++;
      }
    }

    console.log(
      `[Scheduler] Initialized scheduler with ${registeredCount} active schedules.`,
    );
  } catch (err) {
    console.error('[Scheduler] Failed to initialize schedules:', err);
  }
}

/**
 * Executes a capture run for a schedule (used both by cron and by manual "Run Now" trigger)
 */
export async function executeScheduledRun(
  scheduleId: string,
): Promise<ScheduledRun> {
  const schedule = await getSchedule(scheduleId);
  if (!schedule) {
    throw new Error(`Schedule not found: ${scheduleId}`);
  }

  // Re-check the owner's plan on every run: they may have downgraded since saving.
  const info = await planInfoFor(schedule.ownerKey ?? null);
  const position = (await getSchedules())
    .filter((s) => s.ownerKey === schedule.ownerKey)
    .sort((a, b) => a.createdAt - b.createdAt)
    .findIndex((s) => s.id === schedule.id);
  const denial = checkScheduledRun(info, Math.max(0, position), schedule.settings);
  if (denial) throw new PlanLimitError(denial.error);
  const urls = schedule.urls.slice(0, info.limits.pagesPerSchedule);

  console.log(`[Scheduler] Starting capture run for: "${schedule.name}" (${urls.length} URLs)`);

  // Decrypt the saved login (if any) only for the duration of this run.
  const runSettings: CaptureSettings = { ...schedule.settings };
  if (runSettings.auth && 'sealed' in runSettings.auth) {
    const auth = unseal<SiteAuth>(runSettings.auth.sealed);
    if (auth) runSettings.auth = auth; // otherwise capture reports it couldn't decrypt
  }

  // 1. Create a job in the existing job queue (owned by the schedule's owner)
  const job = await createJob('capture', urls, runSettings, schedule.ownerKey);

  // 2. Execute capture through the existing Playwright capture queue.
  // Results are read back from the job afterwards: with several devices the
  // progress keys are "Device:url", so matching on the plain URL would miss them.
  try {
    await captureScreenshots(job.id, urls, runSettings, (key, partial) => {
      updateResult(job.id, key, partial);
    });
  } catch (err) {
    console.error(`[Scheduler] Capture error in job ${job.id}:`, err);
  }

  const finishedJob = getJob(job.id) ?? job;
  const results: ScheduledRunResult[] = Array.from(finishedJob.results.values()).map((r) =>
    r.status === 'done'
      ? { url: r.url, device: r.device, status: 'done', fileName: r.fileName }
      : { url: r.url, device: r.device, status: 'failed', error: r.error ?? 'Not captured' },
  );

  const completedCount = results.filter((r) => r.status === 'done').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const runStatus: 'success' | 'partial' | 'failed' =
    completedCount === results.length
      ? 'success'
      : completedCount > 0
        ? 'partial'
        : 'failed';

  // 3. Prepare run directory and copy files
  const timestamp = Date.now();
  const tmpJobDir = path.join(process.cwd(), 'tmp', job.id);

  // We record the run metadata first to allocate runId
  const pendingRun = await recordScheduledRun(schedule.id, {
    timestamp,
    status: runStatus,
    totalUrls: results.length,
    completedUrls: completedCount,
    failedUrls: failedCount,
    jobId: job.id,
    results,
    notificationSent: false,
  });

  const destRunDir = getRunDir(schedule.id, pendingRun.id);

  // Copy captured files from tmp/{job.id} to data/schedules/{schedule.id}/runs/{pendingRun.id}
  try {
    // Recursive: multi-device captures are stored in per-device subfolders.
    await fs.cp(tmpJobDir, destRunDir, { recursive: true, filter: (src) => !src.endsWith('.zip') });

    // 4. Create persistent archive.zip for this historical run
    const zipPath = path.join(destRunDir, 'archive.zip');
    await createZipFile(destRunDir, zipPath);
    pendingRun.zipFileName = 'archive.zip';

    // Update manifest with zipFileName
    const manifestPath = path.join(destRunDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(pendingRun, null, 2), 'utf-8');
  } catch (copyErr) {
    console.error(`[Scheduler] Error copying files for run ${pendingRun.id}:`, copyErr);
  }

  // 5. Compare with the previous run, page by page (same URL + device).
  const changes = new Map<string, number | null>();
  const previous = (await getScheduledRuns(schedule.id)).find((r) => r.id !== pendingRun.id && r.timestamp <= pendingRun.timestamp);
  if (previous) {
    const threshold = schedule.changeThreshold ?? 1;
    const prevDir = getRunDir(schedule.id, previous.id);
    let changedPages = 0;
    for (const r of pendingRun.results) {
      if (r.status !== 'done' || !r.fileName) continue;
      const before = previous.results.find((p) => p.status === 'done' && p.fileName && p.url === r.url && p.device === r.device);
      if (!before?.fileName) continue;
      r.changePct = await percentChanged(path.join(prevDir, before.fileName), path.join(destRunDir, r.fileName));
      changes.set(`${r.device ?? ''}|${r.url}`, r.changePct);
      if (r.changePct !== null && r.changePct >= threshold) changedPages++;
    }
    pendingRun.comparedToRunId = previous.id;
    pendingRun.changedPages = changedPages;
    await fs.writeFile(path.join(destRunDir, 'manifest.json'), JSON.stringify(pendingRun, null, 2), 'utf-8');
  }

  // 6. Email: after every run, or only when something changed. No recipients -> no email.
  const onlyOnChange = schedule.notifyOn === 'changes';
  const shouldEmail =
    (schedule.recipients?.length ?? 0) > 0 && (!onlyOnChange || (pendingRun.changedPages ?? 0) > 0);
  const emailRes = shouldEmail ? await sendScheduledRunEmail(schedule, pendingRun) : { success: false as const };
  if (emailRes.success) {
    pendingRun.notificationSent = true;
    if ('previewUrl' in emailRes && emailRes.previewUrl) {
      pendingRun.emailPreviewUrl = emailRes.previewUrl;
    }
    const manifestPath = path.join(destRunDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(pendingRun, null, 2), 'utf-8');
  }

  // 7. Add the run to the owner's capture history
  if (schedule.ownerKey) {
    await saveCaptureFromJob(
      schedule.ownerKey,
      { ...finishedJob, results: finishedJob.results.values() },
      { scheduleName: schedule.name, changes },
    ).catch((err) => console.error(`[Scheduler] Could not save run ${pendingRun.id} to history:`, err));
  }

  console.log(`[Scheduler] Completed scheduled run ${pendingRun.id} for "${schedule.name}". Status: ${runStatus}`);
  return pendingRun;
}
