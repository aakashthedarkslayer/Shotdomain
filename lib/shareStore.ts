import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SHARE_DAYS } from './plans';

/**
 * Share links. Creating one copies a finished capture out of tmp/ (deleted
 * about an hour after the capture) into data/shared/<captureId>/, where it
 * stays for SHARE_DAYS. Then the link and its screenshots are deleted.
 * Stopping a share deletes them straight away. There is no other copy:
 * ShotDomain keeps no capture history.
 *
 * Tokens live in data/shares.json; each capture's file list in its meta.json.
 */

export interface Share {
  token: string;
  ownerKey: string;
  /** The capture job's id; also the folder under data/shared/. */
  captureId: string;
  label: string;
  createdAt: number;
  expiresAt: number;
}

export interface SharedResult {
  url: string;
  device?: string;
  status: 'done' | 'failed';
  /** Path inside the shared folder, e.g. "desktop/about.png". */
  fileName?: string;
  error?: string;
}

export interface SharedCapture {
  id: string;
  rootUrl: string;
  createdAt: number;
  devices: string[];
  done: number;
  failed: number;
  results: SharedResult[];
}

/** The part of a capture job a share needs. */
export interface ShareableJob {
  id: string;
  createdAt: number;
  urls: string[];
  settings?: { device?: string; devices?: string[] };
  results: Iterable<{ url: string; device?: string; status: string; fileName?: string; error?: string }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'shares.json');
const SHARED_DIR = path.join(DATA_DIR, 'shared');
const TMP_DIR = path.join(process.cwd(), 'tmp');
const TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/;
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DAY = 24 * 60 * 60 * 1000;

function isShare(s: unknown): s is Share {
  const v = s as Share;
  return !!v && typeof v.token === 'string' && typeof v.ownerKey === 'string' && typeof v.expiresAt === 'number' && ID_RE.test(v.captureId ?? '');
}

/** Folder of a shared capture. */
export function sharedDir(captureId: string): string {
  if (!ID_RE.test(captureId)) throw new Error('Invalid capture id');
  return path.join(SHARED_DIR, captureId);
}

// ---------------------------------------------------------------------------
// shares.json (serialised read-modify-write)
// ---------------------------------------------------------------------------

let writing: Promise<unknown> = Promise.resolve();

async function readRaw(): Promise<unknown[]> {
  try {
    const data = JSON.parse(await fs.readFile(FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function readAll(): Promise<Share[]> {
  return (await readRaw()).filter(isShare);
}

async function mutate<T>(fn: (all: Share[]) => { next: Share[]; out: T }): Promise<T> {
  const run = writing.then(async () => {
    const { next, out } = fn(await readAll());
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tmp, FILE);
    return out;
  });
  writing = run.catch(() => undefined);
  return run;
}

// ---------------------------------------------------------------------------
// Expiry
// ---------------------------------------------------------------------------

let lastSweep = 0;

/**
 * Delete expired shares and their screenshots, plus entries in an older
 * format (from before links expired). Runs at most every 10 minutes unless
 * forced; every read also hides expired links on its own.
 */
export async function sweepExpiredShares(force = false): Promise<void> {
  if (!force && Date.now() - lastSweep < 10 * 60 * 1000) return;
  lastSweep = Date.now();
  const raw = await readRaw();
  const now = Date.now();
  const keep = raw.filter((s): s is Share => isShare(s) && s.expiresAt > now);
  if (keep.length !== raw.length) await mutate(() => ({ next: keep, out: undefined }));
  // Folders no live share points at (expired, revoked, or left by a crash).
  const live = new Set(keep.map((s) => s.captureId));
  const dirs = await fs.readdir(SHARED_DIR).catch(() => [] as string[]);
  await Promise.all(dirs.filter((d) => ID_RE.test(d) && !live.has(d)).map((d) => fs.rm(path.join(SHARED_DIR, d), { recursive: true, force: true })));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** A live (not expired) share. */
export async function getShare(token: string): Promise<Share | null> {
  if (!TOKEN_RE.test(token)) return null;
  void sweepExpiredShares().catch(() => undefined);
  const share = (await readAll()).find((s) => s.token === token);
  return share && share.expiresAt > Date.now() ? share : null;
}

/** The user's live shares, newest first. */
export async function listShares(ownerKey: string): Promise<Share[]> {
  void sweepExpiredShares().catch(() => undefined);
  const now = Date.now();
  return (await readAll()).filter((s) => s.ownerKey === ownerKey && s.expiresAt > now).sort((a, b) => b.createdAt - a.createdAt);
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Copy a job's screenshots (not its ZIP) into the shared folder and write its file list. */
async function copyCapture(job: ShareableJob): Promise<SharedCapture | null> {
  const results: SharedResult[] = [];
  for (const r of job.results) {
    if (r.status === 'done' && r.fileName) results.push({ url: r.url, device: r.device, status: 'done', fileName: r.fileName });
    else if (r.status === 'failed') results.push({ url: r.url, device: r.device, status: 'failed', error: r.error });
  }
  const done = results.filter((r) => r.status === 'done').length;
  if (done === 0) return null;

  const dest = sharedDir(job.id);
  await fs.rm(dest, { recursive: true, force: true });
  await fs.mkdir(dest, { recursive: true });
  await fs.cp(path.join(TMP_DIR, job.id), dest, { recursive: true, filter: (p) => !p.endsWith('.zip') });

  let rootUrl = job.urls[0] ?? '';
  try {
    rootUrl = new URL(rootUrl).origin;
  } catch {
    // keep as-is
  }
  const capture: SharedCapture = {
    id: job.id,
    rootUrl,
    createdAt: job.createdAt,
    devices: job.settings?.devices?.length ? job.settings.devices : [job.settings?.device ?? 'Desktop'],
    done,
    failed: results.length - done,
    results,
  };
  await fs.writeFile(path.join(dest, 'meta.json'), JSON.stringify(capture, null, 2), 'utf8');
  return capture;
}

/**
 * Share a finished capture: returns its existing live share, or copies the
 * screenshots and creates a link that expires in SHARE_DAYS days.
 */
export async function createShare(ownerKey: string, job: ShareableJob): Promise<Share | null> {
  const existing = (await listShares(ownerKey)).find((s) => s.captureId === job.id);
  if (existing) return existing;
  const capture = await copyCapture(job);
  if (!capture) return null;
  const now = Date.now();
  const share: Share = {
    token: crypto.randomBytes(24).toString('base64url'),
    ownerKey,
    captureId: job.id,
    label: `${hostOf(capture.rootUrl)}, ${capture.done} ${capture.done === 1 ? 'screenshot' : 'screenshots'}`,
    createdAt: now,
    expiresAt: now + SHARE_DAYS * DAY,
  };
  // Two clicks at once: the first link written wins, so both get the same token.
  return mutate((all) => {
    const live = all.find((s) => s.captureId === job.id && s.expiresAt > now);
    return live ? { next: all, out: live } : { next: [...all.filter((s) => s.captureId !== job.id), share], out: share };
  });
}

/** After a retry: if the capture is shared, copy it again so the retried screenshot is included. */
export async function refreshSharedCapture(job: ShareableJob): Promise<void> {
  const share = (await readAll()).find((s) => s.captureId === job.id && s.expiresAt > Date.now());
  if (!share) return;
  const capture = await copyCapture(job);
  if (capture) {
    const label = `${hostOf(capture.rootUrl)}, ${capture.done} ${capture.done === 1 ? 'screenshot' : 'screenshots'}`;
    await mutate((all) => ({ next: all.map((s) => (s.token === share.token ? { ...s, label } : s)), out: undefined }));
  }
}

/** Stop sharing: the link stops working and its screenshots are deleted. */
export async function revokeShare(ownerKey: string, token: string): Promise<boolean> {
  const removed = await mutate((all) => {
    const hit = all.find((s) => s.token === token && s.ownerKey === ownerKey);
    return { next: hit ? all.filter((s) => s !== hit) : all, out: hit };
  });
  if (!removed) return false;
  await fs.rm(sharedDir(removed.captureId), { recursive: true, force: true });
  return true;
}

// ---------------------------------------------------------------------------
// Reading a share
// ---------------------------------------------------------------------------

export async function getSharedCapture(share: Share): Promise<SharedCapture | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(sharedDir(share.captureId), 'meta.json'), 'utf8')) as SharedCapture;
  } catch {
    return null;
  }
}

/**
 * Absolute path of a screenshot in a shared capture. Only files listed in its
 * meta.json are allowed (a whitelist: nothing from the URL becomes a path).
 */
export function sharedFilePath(capture: SharedCapture, file: string | null): string | null {
  const match = capture.results.find((r) => r.status === 'done' && r.fileName && r.fileName === file);
  if (!match?.fileName) return null;
  const root = sharedDir(capture.id);
  const resolved = path.resolve(root, match.fileName);
  return resolved.startsWith(root + path.sep) ? resolved : null;
}

/** File name for the shared ZIP, e.g. example.com-2026-11-23.zip. */
export function sharedZipName(capture: SharedCapture): string {
  return `${hostOf(capture.rootUrl)}-${new Date(capture.createdAt).toISOString().slice(0, 10)}.zip`.replace(/[^a-z0-9.-]/gi, '_');
}
