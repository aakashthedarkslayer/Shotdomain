import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { planInfoFor } from './billing';

/**
 * Per-user data on disk (no database):
 *   data/users/{userKey}/profile.json
 *   data/users/{userKey}/captures/{captureId}/meta.json + screenshot files
 *
 * userKey is a hash of the Google email (never the raw email in paths), or
 * "local" when sign-in isn't configured.
 */

export const LOCAL_USER_KEY = 'local';
const USERS_DIR = path.join(process.cwd(), 'data', 'users');

const KEY_RE = /^(local|[a-f0-9]{24})$/;
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function userKeyForEmail(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 24);
}

function userDir(userKey: string): string {
  if (!KEY_RE.test(userKey)) throw new Error('Invalid user key');
  return path.join(USERS_DIR, userKey);
}

function capturesDir(userKey: string): string {
  return path.join(userDir(userKey), 'captures');
}

function captureDir(userKey: string, captureId: string): string {
  if (!ID_RE.test(captureId)) throw new Error('Invalid capture id');
  return path.join(capturesDir(userKey), captureId);
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, file); // atomic replace
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface Profile {
  displayName?: string;
  company?: string;
  updatedAt?: number;
}

export const PROFILE_LIMITS = { displayName: 60, company: 80 };

export async function getProfile(userKey: string): Promise<Profile> {
  return (await readJson<Profile>(path.join(userDir(userKey), 'profile.json'))) ?? {};
}

export async function saveProfile(userKey: string, profile: Profile): Promise<Profile> {
  const clean: Profile = {
    displayName: profile.displayName?.trim().slice(0, PROFILE_LIMITS.displayName) || undefined,
    company: profile.company?.trim().slice(0, PROFILE_LIMITS.company) || undefined,
    updatedAt: Date.now(),
  };
  await writeJson(path.join(userDir(userKey), 'profile.json'), clean);
  return clean;
}

// ---------------------------------------------------------------------------
// Capture history
// ---------------------------------------------------------------------------

export interface HistoryResult {
  url: string;
  device?: string;
  /** Scheduled runs only: % changed since the previous run. */
  changePct?: number | null;
  status: 'done' | 'failed';
  fileName?: string;
  error?: string;
}

export interface CaptureMeta {
  id: string;
  rootUrl: string;
  createdAt: number;
  savedAt: number;
  devices: string[];
  fullPage: boolean;
  format: 'png' | 'jpeg';
  done: number;
  failed: number;
  results: HistoryResult[];
  /** Set when the capture came from a scheduled run. */
  scheduleName?: string;
}

export async function listCaptures(userKey: string): Promise<CaptureMeta[]> {
  let ids: string[] = [];
  try {
    ids = (await fs.readdir(capturesDir(userKey))).filter((n) => ID_RE.test(n));
  } catch {
    return [];
  }
  const metas = await Promise.all(ids.map((id) => readJson<CaptureMeta>(path.join(capturesDir(userKey), id, 'meta.json'))));
  return metas.filter((m): m is CaptureMeta => !!m).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getCapture(userKey: string, captureId: string): Promise<CaptureMeta | null> {
  if (!ID_RE.test(captureId)) return null;
  return readJson<CaptureMeta>(path.join(captureDir(userKey, captureId), 'meta.json'));
}

export async function deleteCapture(userKey: string, captureId: string): Promise<void> {
  await fs.rm(captureDir(userKey, captureId), { recursive: true, force: true });
}

/** Absolute path of a file inside a capture, or null if it would escape the capture folder. */
export function captureFilePath(userKey: string, captureId: string, file: string): string | null {
  if (!ID_RE.test(captureId) || !KEY_RE.test(userKey)) return null;
  const root = captureDir(userKey, captureId);
  const resolved = path.resolve(root, file);
  if (!resolved.startsWith(root + path.sep) || path.basename(resolved) === 'meta.json') return null;
  return resolved;
}

export function captureDirPath(userKey: string, captureId: string): string {
  return captureDir(userKey, captureId);
}

/**
 * Copy a finished job's screenshots out of tmp/ (deleted after 1h) into the
 * user's history and write its metadata. Re-saving the same job (e.g. after a
 * retry) replaces the earlier copy.
 */
export async function saveCaptureFromJob(
  userKey: string,
  job: {
    id: string;
    createdAt: number;
    urls: string[];
    settings?: { device?: string; devices?: string[]; fullPage: boolean; format: 'png' | 'jpeg' };
    results: Iterable<{ url: string; device?: string; status: string; fileName?: string; error?: string }>;
  },
  extra: { scheduleName?: string; changes?: Map<string, number | null> } = {},
): Promise<void> {
  const results: HistoryResult[] = [];
  for (const r of job.results) {
    const changePct = extra.changes?.get(`${r.device ?? ''}|${r.url}`);
    if (r.status === 'done' && r.fileName)
      results.push({ url: r.url, device: r.device, status: 'done', fileName: r.fileName, ...(changePct !== undefined ? { changePct } : {}) });
    else if (r.status === 'failed') results.push({ url: r.url, device: r.device, status: 'failed', error: r.error });
  }
  const done = results.filter((r) => r.status === 'done').length;
  if (done === 0) return; // nothing worth keeping

  const dest = captureDir(userKey, job.id);
  const src = path.join(process.cwd(), 'tmp', job.id);
  await fs.rm(dest, { recursive: true, force: true });
  await fs.mkdir(dest, { recursive: true });
  await fs.cp(src, dest, { recursive: true, filter: (p) => !p.endsWith('.zip') });

  let rootUrl = job.urls[0] ?? '';
  try {
    rootUrl = new URL(rootUrl).origin;
  } catch {
    // keep as-is
  }
  const devices = job.settings?.devices?.length ? job.settings.devices : [job.settings?.device ?? 'Desktop'];
  const meta: CaptureMeta = {
    id: job.id,
    rootUrl,
    createdAt: job.createdAt,
    savedAt: Date.now(),
    devices,
    fullPage: !!job.settings?.fullPage,
    format: job.settings?.format ?? 'png',
    done,
    failed: results.length - done,
    results,
    ...(extra.scheduleName ? { scheduleName: extra.scheduleName } : {}),
  };
  await writeJson(path.join(dest, 'meta.json'), meta);
  await pruneCaptures(userKey);
}

async function pruneCaptures(userKey: string): Promise<void> {
  const all = await listCaptures(userKey);
  const keep = (await planInfoFor(userKey)).limits.historyKept;
  await Promise.all(all.slice(keep).map((m) => deleteCapture(userKey, m.id)));
}
