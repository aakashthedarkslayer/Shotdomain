import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { CaptureSettings } from './jobStore';

export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface Schedule {
  id: string;
  name: string;
  targetUrl: string;
  urls: string[];
  settings: CaptureSettings;
  frequency: FrequencyType;
  timeOfDay: string; // e.g. "09:00"
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, ... (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  cronExpression: string; // generated standard 5-part cron expression
  enabled: boolean;
  recipients: string[]; // default account email + any additional team emails
  retentionCount: number; // default 10
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  lastRunStatus?: 'success' | 'partial' | 'failed' | 'running';
  lastRunJobId?: string;
  nextRunAt?: number;
  /** userKey of the creator. Schedules without one predate per-user schedules. */
  ownerKey?: string;
  /** Email after every run (default) or only when pages changed since the previous run. */
  notifyOn?: 'every' | 'changes';
  /** % of a page that must differ to count as "changed" (default 1). */
  changeThreshold?: number;
}

export interface ScheduledRunResult {
  url: string;
  device?: string;
  /** % of the page that differs from the previous run (null: couldn't compare). */
  changePct?: number | null;
  fileName?: string;
  status: 'done' | 'failed';
  error?: string;
}

export interface ScheduledRun {
  id: string;
  scheduleId: string;
  timestamp: number;
  status: 'running' | 'success' | 'partial' | 'failed';
  totalUrls: number;
  completedUrls: number;
  failedUrls: number;
  jobId: string;
  zipFileName?: string;
  results: ScheduledRunResult[];
  notificationSent: boolean;
  emailPreviewUrl?: string;
  /** Previous run this one was compared against (absent on the first run). */
  comparedToRunId?: string;
  /** Pages whose change is at or above the schedule's threshold. */
  changedPages?: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');
const SCHEDULES_STORAGE_DIR = path.join(DATA_DIR, 'schedules');

// Ensure data directories exist
function ensureDirs() {
  if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fsSync.existsSync(SCHEDULES_STORAGE_DIR)) {
    fsSync.mkdirSync(SCHEDULES_STORAGE_DIR, { recursive: true });
  }
  if (!fsSync.existsSync(SCHEDULES_FILE)) {
    fsSync.writeFileSync(SCHEDULES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

/**
 * Generate a standard 5-field cron expression from frequency and time
 */
export function buildCronExpression(
  frequency: FrequencyType,
  timeOfDay: string, // "HH:MM"
  dayOfWeek = 1,
  dayOfMonth = 1,
): string {
  const [hourStr, minuteStr] = timeOfDay.split(':');
  const hour = parseInt(hourStr || '9', 10);
  const minute = parseInt(minuteStr || '0', 10);

  switch (frequency) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${dayOfWeek}`;
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth} * *`;
    default:
      return `${minute} ${hour} * * *`;
  }
}

/**
 * Calculate the next run timestamp given a frequency and time
 */
export function calculateNextRun(
  frequency: FrequencyType,
  timeOfDay: string,
  dayOfWeek = 1,
  dayOfMonth = 1,
): number {
  const [hourStr, minuteStr] = timeOfDay.split(':');
  const hour = parseInt(hourStr || '9', 10);
  const minute = parseInt(minuteStr || '0', 10);

  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (frequency === 'daily') {
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
  } else if (frequency === 'weekly') {
    const currentDay = next.getDay();
    const diff = (dayOfWeek - currentDay + 7) % 7;
    if (diff === 0 && next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + diff);
    }
  } else if (frequency === 'monthly') {
    next.setDate(dayOfMonth);
    if (next.getTime() <= now.getTime()) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next.getTime();
}

/**
 * Load all schedules from data/schedules.json
 */
export async function getSchedules(): Promise<Schedule[]> {
  ensureDirs();
  try {
    const content = await fs.readFile(SCHEDULES_FILE, 'utf-8');
    return JSON.parse(content) as Schedule[];
  } catch {
    return [];
  }
}

/**
 * Save all schedules atomically
 */
export async function saveSchedules(schedules: Schedule[]): Promise<void> {
  ensureDirs();
  const tempFile = `${SCHEDULES_FILE}.tmp.${Date.now()}`;
  await fs.writeFile(tempFile, JSON.stringify(schedules, null, 2), 'utf-8');
  await fs.rename(tempFile, SCHEDULES_FILE);
}

/**
 * Get a single schedule by ID
 */
export async function getSchedule(id: string): Promise<Schedule | null> {
  const schedules = await getSchedules();
  return schedules.find((s) => s.id === id) || null;
}

/**
 * Create a new schedule
 */
export async function createSchedule(
  data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'cronExpression' | 'nextRunAt'> & {
    retentionCount?: number;
  },
): Promise<Schedule> {
  const schedules = await getSchedules();
  const id = uuidv4();
  const cronExpression = buildCronExpression(
    data.frequency,
    data.timeOfDay,
    data.dayOfWeek,
    data.dayOfMonth,
  );
  const nextRunAt = calculateNextRun(
    data.frequency,
    data.timeOfDay,
    data.dayOfWeek,
    data.dayOfMonth,
  );

  const newSchedule: Schedule = {
    ...data,
    id,
    cronExpression,
    retentionCount: data.retentionCount || 10,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nextRunAt,
  };

  schedules.push(newSchedule);
  await saveSchedules(schedules);

  // Ensure schedule storage directory exists
  const scheduleDir = path.join(SCHEDULES_STORAGE_DIR, id);
  await fs.mkdir(scheduleDir, { recursive: true });

  return newSchedule;
}

/**
 * Update an existing schedule
 */
export async function updateSchedule(
  id: string,
  partial: Partial<Schedule>,
): Promise<Schedule | null> {
  const schedules = await getSchedules();
  const index = schedules.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const existing = schedules[index];
  const updated: Schedule = {
    ...existing,
    ...partial,
    updatedAt: Date.now(),
  };

  if (partial.frequency || partial.timeOfDay || partial.dayOfWeek || partial.dayOfMonth) {
    updated.cronExpression = buildCronExpression(
      updated.frequency,
      updated.timeOfDay,
      updated.dayOfWeek,
      updated.dayOfMonth,
    );
    updated.nextRunAt = calculateNextRun(
      updated.frequency,
      updated.timeOfDay,
      updated.dayOfWeek,
      updated.dayOfMonth,
    );
  }

  schedules[index] = updated;
  await saveSchedules(schedules);
  return updated;
}

/**
 * Delete a schedule and all its stored historical runs
 */
export async function deleteSchedule(id: string): Promise<boolean> {
  const schedules = await getSchedules();
  const filtered = schedules.filter((s) => s.id !== id);
  if (filtered.length === schedules.length) return false;

  await saveSchedules(filtered);

  // Delete schedule historical data directory
  const scheduleDir = path.join(SCHEDULES_STORAGE_DIR, id);
  try {
    await fs.rm(scheduleDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup error
  }

  return true;
}

/**
 * Get the path to a schedule's runs directory
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Schedule and run ids are UUIDs; anything else is rejected before it reaches a path. */
export function isValidId(id: string): boolean {
  return UUID_RE.test(id);
}

export function getScheduleRunsDir(scheduleId: string): string {
  if (!isValidId(scheduleId)) throw new Error('Invalid schedule id');
  return path.join(SCHEDULES_STORAGE_DIR, scheduleId, 'runs');
}

/**
 * Get the path to a specific run directory
 */
export function getRunDir(scheduleId: string, runId: string): string {
  if (!isValidId(runId)) throw new Error('Invalid run id');
  return path.join(getScheduleRunsDir(scheduleId), runId);
}

/**
 * Save a completed run into historical storage and enforce retention
 */
export async function recordScheduledRun(
  scheduleId: string,
  runData: Omit<ScheduledRun, 'id' | 'scheduleId'>,
): Promise<ScheduledRun> {
  const runId = uuidv4();
  const run: ScheduledRun = {
    ...runData,
    id: runId,
    scheduleId,
  };

  const runsDir = getScheduleRunsDir(scheduleId);
  const currentRunDir = getRunDir(scheduleId, runId);
  await fs.mkdir(currentRunDir, { recursive: true });

  // Save run manifest
  const manifestPath = path.join(currentRunDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(run, null, 2), 'utf-8');

  // Update schedule status
  const schedule = await getSchedule(scheduleId);
  if (schedule) {
    const nextRunAt = calculateNextRun(
      schedule.frequency,
      schedule.timeOfDay,
      schedule.dayOfWeek,
      schedule.dayOfMonth,
    );
    await updateSchedule(scheduleId, {
      lastRunAt: run.timestamp,
      lastRunStatus: run.status,
      lastRunJobId: run.jobId,
      nextRunAt,
    });

    // Enforce FIFO retention policy (keep last N runs)
    await enforceRetentionPolicy(scheduleId, schedule.retentionCount || 10);
  }

  return run;
}

/**
 * Get all historical runs for a schedule (sorted newest first)
 */
export async function getScheduledRuns(scheduleId: string): Promise<ScheduledRun[]> {
  const runsDir = getScheduleRunsDir(scheduleId);
  if (!fsSync.existsSync(runsDir)) return [];

  try {
    const entries = await fs.readdir(runsDir, { withFileTypes: true });
    const runs: ScheduledRun[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = path.join(runsDir, entry.name, 'manifest.json');
        if (fsSync.existsSync(manifestPath)) {
          try {
            const raw = await fs.readFile(manifestPath, 'utf-8');
            runs.push(JSON.parse(raw) as ScheduledRun);
          } catch {
            // Ignore malformed manifest
          }
        }
      }
    }

    // Sort newest first
    return runs.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

/**
 * Enforce count-based FIFO retention policy: Keep the last `maxCount` runs, delete older.
 */
export async function enforceRetentionPolicy(
  scheduleId: string,
  maxCount = 10,
): Promise<{ kept: number; deleted: number }> {
  const runs = await getScheduledRuns(scheduleId); // sorted newest first
  if (runs.length <= maxCount) {
    return { kept: runs.length, deleted: 0 };
  }

  const toDelete = runs.slice(maxCount);
  let deletedCount = 0;

  for (const oldRun of toDelete) {
    const dir = getRunDir(scheduleId, oldRun.id);
    try {
      await fs.rm(dir, { recursive: true, force: true });
      deletedCount++;
    } catch (err) {
      console.error(`Failed to purge old run ${oldRun.id}:`, err);
    }
  }

  return { kept: maxCount, deleted: deletedCount };
}
