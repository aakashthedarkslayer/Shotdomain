import type { Finding, ResidualHit, Term, TermType } from "../types";
import { DEFAULT_REPLACEMENT } from "../types";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Regex source for a term. Matching is case-insensitive, tolerant of spacing
 * ("Baby Latch" also matches "BabyLatch" / "Baby  Latch") and anchored on
 * letter/digit boundaries so "Arvind" does not match inside "Arvinder".
 */
export function termPattern(text: string, legalSuffix = false): string {
  const words = text.trim().split(/\s+/).map(escape);
  const joined = words.length > 1 ? words.join("[\\s\\u00a0]*") : words[0];
  // Company names swallow a trailing legal suffix so "Acme Pty Ltd" becomes "the Client", not "the Client Pty Ltd".
  const suffix = legalSuffix ? "(?:,?[\\s\\u00a0]+(?:Pty\\.?[\\s\\u00a0]+Ltd|Pty|Ltd|Limited|LLC|L\\.L\\.C|Inc|PLC|GmbH|LLP|Group))?" : "";
  return `(?<![\\p{L}\\p{N}])${joined}${suffix}(?![\\p{L}\\p{N}])`;
}

export function termRegex(text: string, legalSuffix = false): RegExp {
  return new RegExp(termPattern(text, legalSuffix), "giu");
}

export interface Matcher {
  key: string;
  re: RegExp;
  replacement: string;
}

/** Build matchers from enabled findings, longest first so "Dotsquares Ltd" wins over "Dotsquares". */
export function matchersFromFindings(findings: Finding[]): Matcher[] {
  const out: Matcher[] = [];
  for (const f of findings.filter((x) => x.enabled)) {
    const texts = new Set([f.text, ...f.variants]);
    for (const t of texts) {
      if (t.trim().length < 2) continue;
      out.push({ key: f.text, re: termRegex(t, f.type === "client" || f.type === "agency"), replacement: f.replacement });
    }
  }
  return out.sort((a, b) => b.re.source.length - a.re.source.length);
}

/** One combined pass so replacements never get re-matched by a later term. */
/** "the Client" at the start of a sentence or paragraph becomes "The Client". */
export function fitCase(replacement: string, before: string): string {
  if (!/^[a-z]+ /.test(replacement)) return replacement; // phrases only, never emails/domains
  return /(^|[.!?:]\s+|\n\s*)$/.test(before) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
}

export function replaceAll(text: string, matchers: Matcher[]): { text: string; count: number } {
  if (!matchers.length || !text) return { text, count: 0 };
  const combined = new RegExp(matchers.map((m, i) => `(?<m${i}>${m.re.source})`).join("|"), "giu");
  let count = 0;
  const result = text.replace(combined, (...args) => {
    const groups = args[args.length - 1] as Record<string, string | undefined>;
    for (let i = 0; i < matchers.length; i++) {
      if (groups[`m${i}`] !== undefined) {
        count++;
        const offset = args[args.length - 3] as number;
        return fitCase(matchers[i].replacement, text.slice(Math.max(0, offset - 3), offset));
      }
    }
    return args[0] as string;
  });
  return { text: result, count };
}

/** Find spans for a combined regex; used by the DOCX run-aware rewriter. */
export function findSpans(text: string, matchers: Matcher[]): Array<{ start: number; end: number; replacement: string }> {
  if (!matchers.length || !text) return [];
  const combined = new RegExp(matchers.map((m, i) => `(?<m${i}>${m.re.source})`).join("|"), "giu");
  const spans: Array<{ start: number; end: number; replacement: string }> = [];
  for (const m of text.matchAll(combined)) {
    const groups = m.groups || {};
    const i = matchers.findIndex((_, k) => groups[`m${k}`] !== undefined);
    if (m[0].length === 0) continue;
    spans.push({ start: m.index!, end: m.index! + m[0].length, replacement: fitCase(matchers[i].replacement, text.slice(Math.max(0, m.index! - 3), m.index!)) });
  }
  return spans;
}

// ---------------------------------------------------------------------------
// Pattern detectors (things that identify a client without being in the dictionary)

const TECH_DOTTED = new Set(["asp.net", "vb.net", "ado.net", "node.js", "next.js", "vue.js", "react.js", "express.js", "nuxt.js", "three.js", "chart.js", "d3.js", "socket.io", "angular.js", "nest.js"]);

interface PatternDef {
  type: TermType;
  re: RegExp;
  replacement: string;
  reason: string;
  accept?: (m: string) => boolean;
}

const PATTERNS: PatternDef[] = [
  {
    type: "email",
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g,
    replacement: "contact@example.com",
    reason: "Email address",
    accept: (m) => !/@example\.(com|org)$/i.test(m),
  },
  {
    type: "url",
    re: /\b(?:https?:\/\/|www\.)[^\s<>"'()\]]+[^\s<>"'()\].,;:!?]/gi,
    replacement: "https://example.com",
    reason: "Web address",
    accept: (m) => !/^(https?:\/\/)?(www\.)?example\.com/i.test(m),
  },
  {
    type: "url",
    re: /(?<![@\w.\/-])(?:[a-z0-9-]{3,}\.)+(?:com\.au|co\.uk|com|net|org|io|app|ai|co|au|uk|in|nz|us)(?![\w-])/gi,
    replacement: "example.com",
    reason: "Domain name",
    accept: (m) => !TECH_DOTTED.has(m.toLowerCase()) && !/^example\./i.test(m) && !/^www\.example/i.test(m),
  },
  {
    type: "phone",
    re: /(?<![\w.])(?:\+\d{1,3}[\s.-]?)?(?:\(?0?\d{1,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}(?!\w|\.\d)/g,
    replacement: "+00 000 000 000",
    reason: "Phone number",
    accept: (m) => {
      const digits = m.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 15) return false;
      if (/^(19|20)\d{2}[\s.-]?\d/.test(m) && !m.startsWith("+")) return false; // dates / years
      return m.startsWith("+") || m.startsWith("0") || m.startsWith("(") || /^1[38]00/.test(m);
    },
  },
  {
    type: "id_number",
    re: /\b(?:ABN|ACN|NZBN|VAT(?:\s*(?:No|Number|Reg))?|Company\s*(?:No|Number)|CRN)\.?[:\s#]*[A-Z]{0,2}\s?\d[\d\s]{6,14}\d\b/gi,
    replacement: "[Company ID]",
    reason: "Company / tax registration number",
  },
];

/** Names that follow labels such as "Prepared by" or "Contact:" (also across table cells). */
const PERSON_LABEL = /\b(?:prepared by|reviewed by|approved by|authored by|written by|author|contact person|contact name|point of contact|project manager|account manager|product owner|client contact|attention|attn)\b[ \t]*[:\-–]?[ \t]*\n?[ \t]*/gi;
const NAME_AT = /^[A-Z][a-z'’-]+(?:[ \t]+[A-Z][a-z'’-]+){0,2}/;
const NOT_A_NAME = new Set(["The", "Client", "Team", "Date", "Version", "Description", "Name", "Role", "Email", "Phone", "Project", "Manager", "Development", "Designer", "Developer", "Reviewed", "Prepared", "Approved"]);

export interface DetectedPattern {
  text: string;
  type: TermType;
  replacement: string;
  reason: string;
  count: number;
}

export function detectPatterns(text: string): DetectedPattern[] {
  const found = new Map<string, DetectedPattern>();
  for (const p of PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      const value = m[0].trim();
      if (p.accept && !p.accept(value)) continue;
      const key = value.toLowerCase();
      // A bare domain already covered by a full URL or email is still worth its own row.
      const prev = found.get(key);
      if (prev) prev.count++;
      else found.set(key, { text: value, type: p.type, replacement: p.replacement, reason: p.reason, count: 1 });
    }
  }
  for (const m of text.matchAll(PERSON_LABEL)) {
    const nm = text.slice(m.index! + m[0].length).match(NAME_AT);
    if (!nm) continue;
    const name = nm[0].trim();
    if (name.split(/\s+/).some((w) => NOT_A_NAME.has(w))) continue;
    const key = name.toLowerCase();
    if (!found.has(key)) found.set(key, { text: name, type: "person", replacement: "[Name]", reason: "Name after a label like “Prepared by”", count: 1 });
  }
  return [...found.values()];
}

/** Count occurrences of a term and collect the distinct spellings used. */
export function occurrences(text: string, term: string): { count: number; variants: string[] } {
  const variants = new Set<string>();
  let count = 0;
  for (const m of text.matchAll(termRegex(term))) {
    count++;
    variants.add(m[0]);
  }
  return { count, variants: [...variants] };
}

export function termToFinding(t: Pick<Term, "text" | "type" | "replacement">, origin: Finding["origin"], text: string, id: string, reason?: string): Finding | null {
  const { count, variants } = occurrences(text, t.text);
  if (!count) return null;
  return {
    id,
    text: t.text,
    variants,
    type: t.type,
    replacement: t.replacement || DEFAULT_REPLACEMENT[t.type],
    origin,
    count,
    enabled: true,
    reason,
  };
}

/** Leftover identifying text in a cleaned output. Disabled findings are intentionally kept, so skipped. */
export function residualCheck(cleanedText: string, findings: Finding[]): ResidualHit[] {
  const hits: ResidualHit[] = [];
  const replacements = new Set(findings.map((f) => f.replacement.toLowerCase()));
  for (const f of findings.filter((x) => x.enabled)) {
    for (const t of new Set([f.text, ...f.variants])) {
      if (replacements.has(t.toLowerCase())) continue;
      const ms = [...cleanedText.matchAll(termRegex(t))];
      if (ms.length) hits.push({ text: t, count: ms.length, context: snippet(cleanedText, ms[0].index!, ms[0][0].length) });
    }
  }
  for (const p of detectPatterns(cleanedText)) {
    if (replacements.has(p.text.toLowerCase())) continue;
    const disabled = findings.some((f) => !f.enabled && f.text.toLowerCase() === p.text.toLowerCase());
    if (disabled || hits.some((h) => h.text.toLowerCase() === p.text.toLowerCase())) continue;
    const idx = cleanedText.toLowerCase().indexOf(p.text.toLowerCase());
    hits.push({ text: p.text, count: p.count, context: snippet(cleanedText, Math.max(0, idx), p.text.length) });
  }
  return hits;
}

function snippet(text: string, index: number, len: number): string {
  const s = Math.max(0, index - 50);
  return text.slice(s, index + len + 50).replace(/\s+/g, " ").trim();
}
