import * as dns from 'dns/promises';
import * as net from 'net';

/**
 * Keeps captures and discovery on the public internet. On a hosted server,
 * a user could otherwise point ShotDomain at the server's own network
 * (localhost, 10.x, cloud metadata at 169.254.169.254, ...) and read what
 * it sees. Checked before a job starts and again on every browser request,
 * so a redirect to a private address is blocked too.
 *
 * Allowed when sign-in isn't configured (local single-user mode: people
 * screenshot their own localhost sites) or when ALLOW_PRIVATE_TARGETS=true.
 */

export function privateTargetsAllowed(): boolean {
  if (process.env.ALLOW_PRIVATE_TARGETS === 'true') return true;
  return !(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((n, part) => n * 256 + Number(part), 0) >>> 0;
}

/** CIDR ranges that never belong to a public website. */
const PRIVATE_V4: [string, number][] = [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local, cloud metadata
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15], // benchmarking
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
];

function isPrivateV4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return PRIVATE_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (ipv4ToInt(base) & mask);
  });
}

/** Expand "::ffff:1.2.3.4" / "::1" style addresses to 8 hextets. */
function parseV6(ip: string): { hextets: number[]; mappedV4?: string } | null {
  let s = ip.toLowerCase();
  const zone = s.indexOf('%');
  if (zone >= 0) s = s.slice(0, zone);
  let mappedV4: string | undefined;
  const v4 = /:(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (v4) {
    mappedV4 = v4[1];
    const [a, b, c, d] = v4[1].split('.').map(Number);
    s = s.slice(0, v4.index) + `:${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null;
  const parts = [...head, ...Array(fill).fill('0'), ...tail].map((h) => parseInt(h || '0', 16));
  if (parts.length !== 8 || parts.some((p) => Number.isNaN(p))) return null;
  return { hextets: parts, mappedV4 };
}

function isPrivateV6(ip: string): boolean {
  const parsed = parseV6(ip);
  if (!parsed) return true; // unparseable: don't risk it
  const { hextets: h, mappedV4 } = parsed;
  if (h.slice(0, 7).every((x) => x === 0) && (h[7] === 0 || h[7] === 1)) return true; // :: and ::1
  if (h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0xffff) {
    return mappedV4 ? isPrivateV4(mappedV4) : isPrivateV4(`${h[6] >> 8}.${h[6] & 255}.${h[7] >> 8}.${h[7] & 255}`);
  }
  if (h[0] === 0x64 && h[1] === 0xff9b) return true; // NAT64 — could reach anything
  if ((h[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((h[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((h[0] & 0xff00) === 0xff00) return true; // multicast
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) return isPrivateV4(ip);
  if (kind === 6) return isPrivateV6(ip);
  return true;
}

/** Names that only make sense inside a network. */
function isInternalName(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.home') || h.endsWith('.lan') || h.endsWith('.corp')) return true;
  return !h.includes('.'); // single-label names ("intranet", "db")
}

/**
 * Why `url` may not be captured, or null when it's fine. Resolves the
 * hostname and rejects it when any address is private.
 */
export async function checkTargetUrl(url: string): Promise<string | null> {
  if (privateTargetsAllowed()) return null;
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^\[|\]$/g, '');
  } catch {
    return 'That is not a valid web address.';
  }
  const blocked = 'That address is on a private network, so it can’t be captured from here.';
  if (net.isIP(host)) return isPrivateIp(host) ? blocked : null;
  if (isInternalName(host)) return blocked;
  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    return null; // the browser will report the DNS failure in its own words
  }
  return addresses.some((a) => isPrivateIp(a.address)) ? blocked : null;
}

/**
 * Per-job request filter for the browser: `allowed(url)` resolves each
 * hostname once and remembers the answer, so redirects and sub-resources
 * can't reach a private address either.
 */
export interface RequestGuard {
  enabled: boolean;
  allowed: (url: string) => Promise<boolean>;
}

export function createRequestGuard(): RequestGuard {
  const enabled = !privateTargetsAllowed();
  const cache = new Map<string, Promise<boolean>>();
  return {
    enabled,
    allowed(url: string) {
      if (!enabled) return Promise.resolve(true);
      let host: string;
      try {
        const u = new URL(url);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return Promise.resolve(true); // data:, blob:, ...
        host = u.hostname;
      } catch {
        return Promise.resolve(false);
      }
      let pending = cache.get(host);
      if (!pending) {
        pending = checkTargetUrl(`http://${host}/`).then((problem) => problem === null);
        cache.set(host, pending);
      }
      return pending;
    },
  };
}
