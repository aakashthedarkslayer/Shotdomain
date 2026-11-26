import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Per-user data on disk (no database): data/users/{userKey}/profile.json.
 * Screenshots are not kept per user: see lib/shareStore.ts.
 *
 * userKey is a hash of the Google email (never the raw email in paths), or
 * "local" when sign-in isn't configured.
 */

export const LOCAL_USER_KEY = 'local';
const USERS_DIR = path.join(process.cwd(), 'data', 'users');

const KEY_RE = /^(local|[a-f0-9]{24})$/;

export function userKeyForEmail(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 24);
}

function userDir(userKey: string): string {
  if (!KEY_RE.test(userKey)) throw new Error('Invalid user key');
  return path.join(USERS_DIR, userKey);
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
  /** Agency branding on share links: the name and logo clients see. */
  brandName?: string;
  /** https:// URL of a logo image. */
  brandLogoUrl?: string;
  updatedAt?: number;
}

export const PROFILE_LIMITS = { displayName: 60, company: 80, brandName: 60, brandLogoUrl: 500 };

/** A logo URL we're willing to put on a public page: https only, no credentials. */
export function cleanLogoUrl(raw: string | undefined): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:' || u.username || u.password) return undefined;
    return u.toString().slice(0, PROFILE_LIMITS.brandLogoUrl);
  } catch {
    return undefined;
  }
}

export async function getProfile(userKey: string): Promise<Profile> {
  return (await readJson<Profile>(path.join(userDir(userKey), 'profile.json'))) ?? {};
}

export async function saveProfile(userKey: string, profile: Profile): Promise<Profile> {
  const clean: Profile = {
    displayName: profile.displayName?.trim().slice(0, PROFILE_LIMITS.displayName) || undefined,
    company: profile.company?.trim().slice(0, PROFILE_LIMITS.company) || undefined,
    brandName: profile.brandName?.trim().slice(0, PROFILE_LIMITS.brandName) || undefined,
    brandLogoUrl: cleanLogoUrl(profile.brandLogoUrl),
    updatedAt: Date.now(),
  };
  await writeJson(path.join(userDir(userKey), 'profile.json'), clean);
  return clean;
}
