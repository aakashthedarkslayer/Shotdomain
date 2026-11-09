import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getCapture } from './userData';
import type { CaptureMeta, HistoryResult } from './userData';
import { getSchedule, getScheduledRuns, getRunDir } from './scheduleStore';
import { captureDirPath } from './userData';

/**
 * Public share links. A token grants read-only access to exactly one thing:
 *   - screenshot: one image from a saved capture
 *   - capture:    a saved capture (gallery + ZIP)
 *   - schedule:   whatever the schedule's latest run is (updates by itself)
 * Stored in data/shares.json. Revoking deletes the token.
 */

export type ShareKind = 'screenshot' | 'capture' | 'schedule';

export interface Share {
  token: string;
  ownerKey: string;
  kind: ShareKind;
  captureId?: string;
  file?: string;
  scheduleId?: string;
  label: string;
  createdAt: number;
}

const FILE = path.join(process.cwd(), 'data', 'shares.json');
const TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/;

async function readAll(): Promise<Share[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as Share[];
  } catch {
    return [];
  }
}

async function writeAll(shares: Share[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(shares, null, 2), 'utf8');
  await fs.rename(tmp, FILE);
}

export async function getShare(token: string): Promise<Share | null> {
  if (!TOKEN_RE.test(token)) return null;
  return (await readAll()).find((s) => s.token === token) ?? null;
}

export async function listShares(ownerKey: string): Promise<Share[]> {
  return (await readAll()).filter((s) => s.ownerKey === ownerKey).sort((a, b) => b.createdAt - a.createdAt);
}

/** Create (or return the existing) share for this exact target. */
export async function createShare(input: Omit<Share, 'token' | 'createdAt'>): Promise<Share> {
  const all = await readAll();
  const existing = all.find(
    (s) =>
      s.ownerKey === input.ownerKey &&
      s.kind === input.kind &&
      s.captureId === input.captureId &&
      s.file === input.file &&
      s.scheduleId === input.scheduleId,
  );
  if (existing) return existing;
  const share: Share = { ...input, token: crypto.randomBytes(24).toString('base64url'), createdAt: Date.now() };
  all.push(share);
  await writeAll(all);
  return share;
}

export async function revokeShare(ownerKey: string, token: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((s) => !(s.token === token && s.ownerKey === ownerKey));
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/** Drop shares pointing at something that was deleted. */
export async function revokeSharesFor(target: { captureId?: string; scheduleId?: string }): Promise<void> {
  const all = await readAll();
  const next = all.filter(
    (s) => !((target.captureId && s.captureId === target.captureId) || (target.scheduleId && s.scheduleId === target.scheduleId)),
  );
  if (next.length !== all.length) await writeAll(next);
}

// ---------------------------------------------------------------------------
// Resolving a share to viewable content
// ---------------------------------------------------------------------------

export interface SharedContent {
  title: string;
  subtitle: string;
  createdAt: number;
  results: HistoryResult[];
  /** Folder the result fileNames are relative to. */
  dir: string;
  zipName: string;
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export async function resolveShare(share: Share): Promise<SharedContent | null> {
  if (share.kind === 'schedule') {
    const schedule = share.scheduleId ? await getSchedule(share.scheduleId) : null;
    if (!schedule || schedule.ownerKey !== share.ownerKey) return null;
    const latest = (await getScheduledRuns(schedule.id))[0];
    if (!latest) {
      return { title: schedule.name, subtitle: 'No runs yet', createdAt: Date.now(), results: [], dir: '', zipName: 'empty.zip' };
    }
    return {
      title: schedule.name,
      subtitle: `Latest run of a scheduled capture of ${hostOf(schedule.targetUrl)}`,
      createdAt: latest.timestamp,
      results: latest.results.map((r) => ({ url: r.url, device: r.device, status: r.status, fileName: r.fileName, error: r.error })),
      dir: getRunDir(schedule.id, latest.id),
      zipName: `${hostOf(schedule.targetUrl)}-latest.zip`,
    };
  }

  const meta: CaptureMeta | null = share.captureId ? await getCapture(share.ownerKey, share.captureId) : null;
  if (!meta) return null;
  const results = share.kind === 'screenshot' ? meta.results.filter((r) => r.fileName === share.file) : meta.results;
  if (share.kind === 'screenshot' && results.length === 0) return null;
  return {
    title: hostOf(meta.rootUrl),
    subtitle: share.kind === 'screenshot' ? 'Shared screenshot' : `${meta.done} screenshots · ${meta.devices.join(', ')}`,
    createdAt: meta.createdAt,
    results,
    dir: captureDirPath(share.ownerKey, meta.id),
    zipName: `${hostOf(meta.rootUrl)}-${new Date(meta.createdAt).toISOString().slice(0, 10)}.zip`,
  };
}

/**
 * Absolute path of an image inside shared content. Only files listed in the
 * content's results are allowed (whitelist — no path handling from the URL).
 * `pageUrl` + `device` picks a page from the latest run (stable embed links).
 */
export function sharedFilePath(content: SharedContent, opts: { file?: string | null; pageUrl?: string | null; device?: string | null }): string | null {
  const done = content.results.filter((r) => r.status === 'done' && r.fileName);
  let match: HistoryResult | undefined;
  if (opts.file) match = done.find((r) => r.fileName === opts.file);
  else if (opts.pageUrl) match = done.find((r) => r.url === opts.pageUrl && (!opts.device || r.device === opts.device));
  else if (done.length === 1) match = done[0];
  if (!match?.fileName) return null;
  const resolved = path.resolve(content.dir, match.fileName);
  return resolved.startsWith(content.dir + path.sep) ? resolved : null;
}
