/**
 * Reads a request copied from browser DevTools (Network → right-click a
 * request → Copy) and keeps only what logs you in: the cookies and
 * login-related headers such as Authorization. Everything else — including
 * the browser's User-Agent — is dropped, so captures keep our own honest UA.
 *
 * Supported copies:
 *   - Copy as cURL (bash / macOS / Linux) and Copy as cURL (cmd) on Windows
 *   - Copy as PowerShell
 *   - Copy as fetch (Node.js)  (the browser variant has no cookies)
 *   - Raw request headers ("Copy request headers", or the raw headers view)
 *
 * Client-safe: used by the login form and by the server.
 */

export type CopiedFormat = 'curl' | 'powershell' | 'fetch' | 'headers';

export interface CopiedRequest {
  format: CopiedFormat;
  /** The request's URL, when the copy includes it. */
  url?: string;
  /** Cookie header value ("a=1; b=2"), '' when the copy has no cookies. */
  cookie: string;
  /** Login-related headers to send along (Authorization, X-Auth-Token, ...). */
  headers: Record<string, string>;
  /** How many other headers were left out (user-agent, accept, sec-*, ...). */
  ignored: number;
}

export const FORMAT_LABEL: Record<CopiedFormat, string> = {
  curl: 'cURL',
  powershell: 'PowerShell',
  fetch: 'fetch',
  headers: 'request headers',
};

/** Headers worth keeping besides cookies: they carry a login, not browser details. */
const KEEP_HEADER = /^(authorization|x-[a-z0-9-]*(auth|token|session|csrf|xsrf|api-?key)[a-z0-9-]*)$/i;
const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/** curl options that take a value we don't need (skip the value too). */
const CURL_VALUE_FLAGS = new Set([
  '-X', '--request', '-d', '--data', '--data-raw', '--data-binary', '--data-urlencode', '--data-ascii', '-F', '--form',
  '-A', '--user-agent', '-e', '--referer', '-o', '--output', '-m', '--max-time', '--connect-timeout', '-x', '--proxy',
  '-u', '--user', '--retry', '-w', '--write-out', '-T', '--upload-file',
]);

// ---------------------------------------------------------------------------
// Tokenising shell commands
// ---------------------------------------------------------------------------

const ANSI_ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '?': '?', a: '\x07', b: '\b', e: '\x1b', f: '\f', v: '\v' };

/** Split a bash-style command line into words ('single', "double", $'ansi-c', \ continuations). */
export function shellWords(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inWord = false;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\' && (s[i + 1] === '\n' || s[i + 1] === '\r')) {
      i += s[i + 1] === '\r' && s[i + 2] === '\n' ? 3 : 2; // line continuation
      continue;
    }
    if (/\s/.test(c)) {
      if (inWord) out.push(cur);
      cur = '';
      inWord = false;
      i++;
      continue;
    }
    inWord = true;
    if (c === "'") {
      const end = s.indexOf("'", i + 1);
      cur += end < 0 ? s.slice(i + 1) : s.slice(i + 1, end);
      i = end < 0 ? s.length : end + 1;
    } else if (c === '$' && s[i + 1] === "'") {
      i += 2;
      while (i < s.length && s[i] !== "'") {
        if (s[i] === '\\' && i + 1 < s.length) {
          const n = s[i + 1];
          if (n === 'x') {
            const hex = /^[0-9a-fA-F]{1,2}/.exec(s.slice(i + 2))?.[0] ?? '';
            cur += hex ? String.fromCharCode(parseInt(hex, 16)) : 'x';
            i += 2 + hex.length;
          } else if (n === 'u' || n === 'U') {
            const hex = new RegExp(`^[0-9a-fA-F]{1,${n === 'u' ? 4 : 8}}`).exec(s.slice(i + 2))?.[0] ?? '';
            cur += hex ? String.fromCodePoint(parseInt(hex, 16)) : n;
            i += 2 + hex.length;
          } else {
            cur += ANSI_ESCAPES[n] ?? n;
            i += 2;
          }
        } else cur += s[i++];
      }
      i++;
    } else if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\' && i + 1 < s.length && '"\\$`\n'.includes(s[i + 1])) {
          cur += s[i + 1];
          i += 2;
        } else cur += s[i++];
      }
      i++;
    } else if (c === '\\' && i + 1 < s.length) {
      cur += s[i + 1];
      i += 2;
    } else {
      cur += c;
      i++;
    }
  }
  if (inWord) out.push(cur);
  return out;
}

/** Windows "Copy as cURL (cmd)": ^-escapes and ^ line continuations, then double-quoted words. */
function cmdWords(s: string): string[] {
  const unescaped = s.replace(/\^\r?\n/g, ' ').replace(/\^([\s\S])/g, '$1');
  return shellWords(unescaped);
}

// ---------------------------------------------------------------------------
// Collecting headers
// ---------------------------------------------------------------------------

class Collector {
  cookies: string[] = [];
  headers: Record<string, string> = {};
  ignored = 0;
  url?: string;
  host?: string;
  path?: string;
  scheme?: string;

  header(name: string, value: string) {
    const n = name.trim();
    const v = value.trim();
    const lower = n.toLowerCase();
    if (!n) return;
    if (lower === 'cookie') {
      if (v) this.cookies.push(v);
    } else if (lower === ':authority' || lower === 'host') {
      this.host = v;
    } else if (lower === ':path') {
      this.path = v;
    } else if (lower === ':scheme') {
      this.scheme = v;
    } else if (KEEP_HEADER.test(n) && HEADER_NAME.test(n) && v) {
      this.headers[n] = v;
    } else {
      this.ignored++;
    }
  }

  headerLine(line: string) {
    // ":authority: x" pseudo-headers start with a colon.
    const i = line.indexOf(':', line.startsWith(':') ? 1 : 0);
    if (i > 0) this.header(line.slice(0, i), line.slice(i + 1));
  }

  result(format: CopiedFormat): CopiedRequest {
    let url = this.url;
    if (!url && this.host) url = `${this.scheme || 'https'}://${this.host}${this.path?.startsWith('/') ? this.path : '/'}`;
    return { format, ...(url ? { url } : {}), cookie: this.cookies.join('; '), headers: this.headers, ignored: this.ignored };
  }
}

function parseCurl(text: string): CopiedRequest {
  const words = /\^"/.test(text) ? cmdWords(text) : shellWords(text);
  const c = new Collector();
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    if (w === '-H' || w === '--header') c.headerLine(words[++i] ?? '');
    else if (w.startsWith('-H') && w.length > 2) c.headerLine(w.slice(2));
    else if (w === '-b' || w === '--cookie') {
      const v = words[++i] ?? '';
      if (v.includes('=')) c.cookies.push(v.trim()); // otherwise it's a cookie-jar file name
    } else if (w === '--url') c.url = words[++i];
    else if (CURL_VALUE_FLAGS.has(w)) i++;
    else if (!w.startsWith('-') && !c.url && /^https?:\/\//i.test(w)) c.url = w;
  }
  return c.result('curl');
}

/** PowerShell double-quoted string body: backtick escapes. */
const psUnescape = (s: string) => s.replace(/`([\s\S])/g, (_, ch: string) => (ch === 'n' ? '\n' : ch === 't' ? '\t' : ch));
const PS_STR = '"((?:[^"`]|`[\\s\\S])*)"';

function parsePowerShell(text: string): CopiedRequest {
  const c = new Collector();
  c.url = new RegExp(`-Uri\\s+${PS_STR}`, 'i').exec(text)?.[1];
  if (c.url) c.url = psUnescape(c.url);
  const cookieRe = new RegExp(`System\\.Net\\.Cookie\\(\\s*${PS_STR}\\s*,\\s*${PS_STR}`, 'gi');
  for (const m of text.matchAll(cookieRe)) c.cookies.push(`${psUnescape(m[1])}=${psUnescape(m[2])}`);
  const block = /-Headers\s+@\{([\s\S]*?)\n?\}/i.exec(text)?.[1] ?? '';
  for (const m of block.matchAll(new RegExp(`${PS_STR}\\s*=\\s*${PS_STR}`, 'g'))) c.header(psUnescape(m[1]), psUnescape(m[2]));
  return c.result('powershell');
}

function parseFetch(text: string): CopiedRequest | null {
  const m = /fetch\(\s*("(?:[^"\\]|\\.)*")\s*,\s*(\{[\s\S]*\})\s*\)\s*;?\s*$/.exec(text.trim());
  if (!m) return null;
  const c = new Collector();
  try {
    c.url = JSON.parse(m[1]);
    const opts = JSON.parse(m[2]) as { headers?: Record<string, unknown> };
    for (const [k, v] of Object.entries(opts.headers ?? {})) c.header(k, String(v ?? ''));
  } catch {
    return null;
  }
  return c.result('fetch');
}

const REQUEST_LINE = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\S+(\s+HTTP\/[\d.]+)?$/i;
const HEADER_LINE = /^:?[A-Za-z0-9-]+:\s*\S/;

function parseRawHeaders(text: string): CopiedRequest | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const first = REQUEST_LINE.exec(lines[0] ?? '');
  const headerLines = lines.filter((l) => HEADER_LINE.test(l));
  // A lone "Cookie: a=b" line is just a cookie header — leave it to the cookie parser.
  if (!first && headerLines.length < 2) return null;
  if (headerLines.length < lines.length - (first ? 1 : 0)) return null; // not all lines are headers
  const c = new Collector();
  if (first) c.path = lines[0].split(/\s+/)[1];
  for (const l of headerLines) c.headerLine(l);
  return c.result('headers');
}

/** A request copied from DevTools, or null if `text` isn't one. */
export function parseCopiedRequest(text: string): CopiedRequest | null {
  const t = text.trim();
  if (!t) return null;
  if (/^curl(\.exe)?\s/i.test(t)) return parseCurl(t);
  if (/Invoke-(WebRequest|RestMethod)\b|WebRequestSession/i.test(t)) return parsePowerShell(t);
  if (/^(await\s+)?fetch\(/i.test(t)) return parseFetch(t);
  return parseRawHeaders(t);
}

/** Merge copied headers into "Name: value" lines, replacing same-named ones. */
export function mergeHeaderLines(existing: string, add: Record<string, string>): string {
  const names = new Set(Object.keys(add).map((k) => k.toLowerCase()));
  const kept = existing
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !names.has(l.slice(0, l.indexOf(':')).trim().toLowerCase()));
  return [...kept, ...Object.entries(add).map(([k, v]) => `${k}: ${v}`)].join('\n');
}
