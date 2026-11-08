import cron, { type ScheduledTask } from 'node-cron';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  getSchedules,
  getSchedule,
  recordScheduledRun,
  getRunDir,
  type Schedule,
  type ScheduledRun,
  type ScheduledRunResult,
} from './scheduleStore';
import { createJob, updateResult } from './jobStore';
import { captureScreenshots } from './screenshot';
import { createZipFile } from './zip';
import { sendScheduledRunEmail } from './email';

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

  console.log(`[Scheduler] Starting capture run for: "${schedule.name}" (${schedule.urls.length} URLs)`);

  // 1. Create a job in the existing job queue
  const job = await createJob('capture', schedule.urls, schedule.settings);

  const results: ScheduledRunResult[] = schedule.urls.map((url) => ({
    url,
    status: 'failed',
  }));

  // 2. Execute capture through the existing Playwright capture queue
  try {
    await captureScreenshots(
      job.id,
      schedule.urls,
      schedule.settings,
      (url, partial) => {
        updateResult(job.id, url, partial);
        const idx = results.findIndex((r) => r.url === url);
        if (idx !== -1 && (partial.status === 'done' || partial.status === 'failed')) {
          results[idx] = {
            url,
            status: partial.status,
            fileName: partial.fileName,
            error: partial.error,
          };
        }
      },
    );
  } catch (err) {
    console.error(`[Scheduler] Capture error in job ${job.id}:`, err);
  }

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
    totalUrls: schedule.urls.length,
    completedUrls: completedCount,
    failedUrls: failedCount,
    jobId: job.id,
    results,
    notificationSent: false,
  });

  const destRunDir = getRunDir(schedule.id, pendingRun.id);

  // Copy captured files from tmp/{job.id} to data/schedules/{schedule.id}/runs/{pendingRun.id}
  try {
    const tmpFiles = await fs.readdir(tmpJobDir);
    for (const file of tmpFiles) {
      const src = path.join(tmpJobDir, file);
      const dst = path.join(destRunDir, file);
      const stat = await fs.stat(src);
      if (stat.isFile()) {
        await fs.copyFile(src, dst);
      }
    }

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

  // 5. Send Email notification
  const emailRes = await sendScheduledRunEmail(schedule, pendingRun);
  if (emailRes.success) {
    pendingRun.notificationSent = true;
    if (emailRes.previewUrl) {
      pendingRun.emailPreviewUrl = emailRes.previewUrl;
    }
    const manifestPath = path.join(destRunDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(pendingRun, null, 2), 'utf-8');
  }

  console.log(`[Scheduler] Completed scheduled run ${pendingRun.id} for "${schedule.name}". Status: ${runStatus}`);
  return pendingRun;
}
