import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Encrypts small secrets (saved site logins) at rest with AES-256-GCM.
 * Key: derived from AUTH_SECRET when set, otherwise a random key generated
 * once into data/.secret-key (local mode). Changing AUTH_SECRET makes
 * previously saved logins unreadable — they must be re-entered.
 */
function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (secret) return crypto.createHash('sha256').update(`shotdomain-secretbox:${secret}`).digest();
  const file = path.join(process.cwd(), 'data', '.secret-key');
  try {
    return Buffer.from(fs.readFileSync(file, 'utf8').trim(), 'base64');
  } catch {
    const k = crypto.randomBytes(32);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, k.toString('base64'), { mode: 0o600 });
    return k;
  }
}

export function seal(value: unknown): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

export function unseal<T>(sealed: string): T | null {
  try {
    const [v, iv, tag, data] = sealed.split(':');
    if (v !== 'v1') return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const text = Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
