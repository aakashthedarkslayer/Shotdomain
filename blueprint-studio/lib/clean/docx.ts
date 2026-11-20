import "server-only";
import JSZip from "jszip";
import * as mupdf from "mupdf";
import type { Finding, ImageItem } from "../types";
import { findSpans, matchersFromFindings, replaceAll, type Matcher } from "./match";

const TEXT_PARTS = /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/;
const RELS_PARTS = /^word\/_rels\/.+\.rels$/;

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
const encode = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Tokens we care about inside WordprocessingML. Paragraph boundaries split matching groups. */
const TOKEN = /<w:p\b[^>]*\/>|<w:p\b[^>]*>|<\/w:p>|<w:t\b([^>]*)>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>|<w:instrText\b([^>]*)>([^<]*)<\/w:instrText>/g;

interface TNode {
  start: number;
  end: number;
  attrs: string;
  text: string;
  group: number;
  tag: "w:t" | "w:instrText";
}

function tokenize(xml: string): TNode[] {
  const nodes: TNode[] = [];
  let group = 0;
  for (const m of xml.matchAll(TOKEN)) {
    const tok = m[0];
    if (tok.startsWith("<w:p") || tok === "</w:p>") {
      group++;
      continue;
    }
    if (tok.startsWith("<w:t")) nodes.push({ start: m.index!, end: m.index! + tok.length, attrs: m[1] || "", text: decode(m[2] || ""), group, tag: "w:t" });
    else if (tok.startsWith("<w:instrText")) nodes.push({ start: m.index!, end: m.index! + tok.length, attrs: m[3] || "", text: decode(m[4] || ""), group: -1 - nodes.length, tag: "w:instrText" });
  }
  return nodes;
}

function partText(xml: string): string {
  const lines: string[] = [];
  let current = "";
  let lastGroup = -1;
  for (const n of tokenize(xml)) {
    if (n.tag !== "w:t") continue;
    if (n.group !== lastGroup && current) {
      lines.push(current);
      current = "";
    }
    lastGroup = n.group;
    current += n.text;
  }
  if (current) lines.push(current);
  return lines.join("\n");
}

/** Replace across runs: a match split over several <w:t> nodes is rewritten into the first one. */
function rewritePart(xml: string, matchers: Matcher[]): { xml: string; count: number } {
  const nodes = tokenize(xml);
  const groups = new Map<number, TNode[]>();
  for (const n of nodes) groups.set(n.group, [...(groups.get(n.group) || []), n]);
  const newText = new Map<TNode, string>();
  let count = 0;
  for (const g of groups.values()) {
    const full = g.map((n) => n.text).join("");
    const spans = findSpans(full, matchers);
    if (!spans.length) continue;
    count += spans.length;
    const offsets: number[] = [];
    let acc = 0;
    for (const n of g) {
      offsets.push(acc);
      acc += n.text.length;
    }
    const texts = g.map((n) => n.text);
    for (const span of [...spans].reverse()) {
      let first = true;
      for (let k = 0; k < g.length; k++) {
        const s = offsets[k];
        const e = s + g[k].text.length;
        if (e <= span.start || s >= span.end) continue;
        const a = Math.max(span.start, s) - s;
        const b = Math.min(span.end, e) - s;
        const insert = first ? span.replacement : "";
        texts[k] = texts[k].slice(0, a) + insert + texts[k].slice(b);
        first = false;
      }
    }
    g.forEach((n, k) => {
      if (texts[k] !== n.text) newText.set(n, texts[k]);
    });
  }
  if (!newText.size) return { xml, count };
  let out = "";
  let pos = 0;
  for (const n of nodes) {
    if (!newText.has(n)) continue;
    const attrs = n.attrs.includes("xml:space") ? n.attrs : `${n.attrs} xml:space="preserve"`;
    out += xml.slice(pos, n.start) + `<${n.tag}${attrs}>${encode(newText.get(n)!)}</${n.tag}>`;
    pos = n.end;
  }
  return { xml: out + xml.slice(pos), count };
}

export interface DocxAnalysis {
  text: string;
  images: Array<Omit<ImageItem, "redact"> & { bytes?: Uint8Array; ext: string }>;
}

async function load(buf: Uint8Array) {
  return JSZip.loadAsync(buf);
}

/** All visible text plus header/footer/comments, document properties and link targets. */
export async function docxText(buf: Uint8Array): Promise<string> {
  const zip = await load(buf);
  const out: string[] = [];
  const names = Object.keys(zip.files).sort((a, b) => (a === "word/document.xml" ? -1 : b === "word/document.xml" ? 1 : a.localeCompare(b)));
  for (const name of names) {
    if (TEXT_PARTS.test(name)) out.push(partText(await zip.file(name)!.async("string")));
  }
  for (const name of names.filter((n) => RELS_PARTS.test(n))) {
    const rels = await zip.file(name)!.async("string");
    for (const m of rels.matchAll(/Target="([^"]+)"[^>]*TargetMode="External"/g)) out.push(decode(m[1]));
  }
  for (const name of ["docProps/core.xml", "docProps/app.xml", "docProps/custom.xml"]) {
    const f = zip.file(name);
    if (f) out.push(decode((await f.async("string")).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim());
  }
  return out.filter(Boolean).join("\n\n");
}

export async function analyzeDocx(buf: Uint8Array): Promise<DocxAnalysis> {
  const zip = await load(buf);
  // Which parts reference which media file (header/footer media are usually logos).
  const referencedBy = new Map<string, string[]>();
  for (const name of Object.keys(zip.files).filter((n) => RELS_PARTS.test(n))) {
    const owner = name.replace("word/_rels/", "").replace(".rels", "");
    const rels = await zip.file(name)!.async("string");
    for (const m of rels.matchAll(/Target="(media\/[^"]+)"/g)) {
      const part = "word/" + m[1];
      referencedBy.set(part, [...(referencedBy.get(part) || []), owner]);
    }
  }
  const images: DocxAnalysis["images"] = [];
  for (const name of Object.keys(zip.files).filter((n) => n.startsWith("word/media/")).sort()) {
    const bytes = await zip.file(name)!.async("uint8array");
    const ext = name.split(".").pop()!.toLowerCase();
    let width = 0;
    let height = 0;
    try {
      const img = new mupdf.Image(bytes);
      width = img.getWidth();
      height = img.getHeight();
    } catch {
      /* EMF/WMF and other vector formats: no preview */
    }
    const owners = referencedBy.get(name) || [];
    const inHeaderFooter = owners.some((o) => /^(header|footer)/.test(o));
    const firstPageOnly = owners.length > 0 && owners.every((o) => o === "document.xml");
    const small = width > 0 && width * height < 250_000;
    const reason = inHeaderFooter ? "Used in a header/footer (likely a logo)" : small && firstPageOnly ? "Small image (possibly a logo)" : undefined;
    images.push({
      id: name.replace(/[^\w]/g, "_"),
      part: name,
      width,
      height,
      suggested: inHeaderFooter,
      reason,
      bytes: ["png", "jpg", "jpeg", "gif", "bmp"].includes(ext) ? bytes : undefined,
      ext,
    });
  }
  return { text: await docxText(buf), images };
}

function placeholderPng(width: number, height: number): Uint8Array {
  const scale = Math.min(1, 400 / Math.max(width || 1, height || 1));
  const w = Math.max(1, Math.round((width || 200) * scale));
  const h = Math.max(1, Math.round((height || 80) * scale));
  const pix = new mupdf.Pixmap(mupdf.ColorSpace.DeviceRGB, [0, 0, w, h], false);
  pix.clear(235);
  return pix.asPNG();
}

export async function cleanDocx(buf: Uint8Array, findings: Finding[], images: ImageItem[]): Promise<{ docx: Uint8Array; replaced: number }> {
  const zip = await load(buf);
  const matchers = matchersFromFindings(findings);
  let replaced = 0;

  for (const name of Object.keys(zip.files)) {
    if (TEXT_PARTS.test(name)) {
      const r = rewritePart(await zip.file(name)!.async("string"), matchers);
      replaced += r.count;
      zip.file(name, r.xml);
    } else if (RELS_PARTS.test(name)) {
      // Hyperlink targets: replace identifying URLs entirely.
      const rels = await zip.file(name)!.async("string");
      const updated = rels.replace(/Target="([^"]+)"([^>]*TargetMode="External")/g, (all, target: string, rest: string) => {
        const r = replaceAll(decode(target), matchers);
        if (!r.count) return all;
        replaced++;
        return `Target="https://example.com"${rest}`;
      });
      zip.file(name, updated);
    }
  }

  // Document properties carry author, company and title.
  const core = zip.file("docProps/core.xml");
  if (core) {
    let xml = await core.async("string");
    xml = xml.replace(/<(dc:creator|cp:lastModifiedBy|dc:title|dc:subject|dc:description|cp:keywords|cp:category)>[^<]*<\/\1>/g, "<$1></$1>");
    zip.file("docProps/core.xml", xml);
  }
  const app = zip.file("docProps/app.xml");
  if (app) {
    let xml = await app.async("string");
    xml = xml.replace(/<(Company|Manager|HyperlinkBase)>[^<]*<\/\1>/g, "<$1></$1>");
    zip.file("docProps/app.xml", xml);
  }
  if (zip.file("docProps/custom.xml")) {
    zip.remove("docProps/custom.xml");
    for (const relName of ["_rels/.rels"]) {
      const f = zip.file(relName);
      if (f) zip.file(relName, (await f.async("string")).replace(/<Relationship[^>]*Target="docProps\/custom\.xml"[^>]*\/>/g, ""));
    }
    const ct = zip.file("[Content_Types].xml");
    if (ct) zip.file("[Content_Types].xml", (await ct.async("string")).replace(/<Override[^>]*PartName="\/docProps\/custom\.xml"[^>]*\/>/g, ""));
  }

  // Blank chosen images. PNG/JPEG keep their part name; other formats become PNG.
  const renames = new Map<string, string>();
  for (const im of images.filter((x) => x.redact && x.part)) {
    const part = im.part!;
    const ext = part.split(".").pop()!.toLowerCase();
    const png = placeholderPng(im.width, im.height);
    if (ext === "png") zip.file(part, png);
    else if (ext === "jpg" || ext === "jpeg") {
      const pix = new mupdf.Image(png).toPixmap();
      zip.file(part, pix.asJPEG(80, false));
    } else {
      const newPart = part.replace(/\.[^.]+$/, ".png");
      zip.remove(part);
      zip.file(newPart, png);
      renames.set(part.replace("word/", ""), newPart.replace("word/", ""));
    }
  }
  if (renames.size) {
    for (const name of Object.keys(zip.files).filter((n) => RELS_PARTS.test(n))) {
      let rels = await zip.file(name)!.async("string");
      for (const [from, to] of renames) rels = rels.split(`Target="${from}"`).join(`Target="${to}"`);
      zip.file(name, rels);
    }
    const ct = zip.file("[Content_Types].xml");
    if (ct) {
      let xml = await ct.async("string");
      if (!/Extension="png"/i.test(xml)) xml = xml.replace("<Types", "<Types").replace(/(<Types[^>]*>)/, `$1<Default Extension="png" ContentType="image/png"/>`);
      zip.file("[Content_Types].xml", xml);
    }
  }

  const docx = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return { docx, replaced };
}

/** Best-effort page previews via MuPDF's Office import; returns [] when it can't lay the file out. */
export function renderDocxPages(buf: Uint8Array, maxPages = 30, scale = 0.8): Uint8Array[] {
  try {
    const doc = mupdf.Document.openDocument(buf, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const out: Uint8Array[] = [];
    for (let i = 0; i < Math.min(doc.countPages(), maxPages); i++) {
      out.push(doc.loadPage(i).toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true).asPNG());
    }
    return out;
  } catch {
    return [];
  }
}
