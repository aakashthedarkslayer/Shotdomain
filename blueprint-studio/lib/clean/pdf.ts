import "server-only";
import * as mupdf from "mupdf";
import { PDFDocument, PDFName, StandardFonts, rgb } from "pdf-lib";
import type { Finding, ImageItem } from "../types";

type Rect = [number, number, number, number];

export interface PdfAnalysis {
  text: string;
  pages: number;
  images: Array<Omit<ImageItem, "redact"> & { png?: Uint8Array }>;
}

const open = (buf: Uint8Array) => mupdf.Document.openDocument(buf, "application/pdf") as mupdf.PDFDocument;

export function pdfText(buf: Uint8Array): string {
  const doc = open(buf);
  const parts: string[] = [];
  for (let i = 0; i < doc.countPages(); i++) parts.push(doc.loadPage(i).toStructuredText("").asText());
  return parts.join("\n\f\n");
}

export function analyzePdf(buf: Uint8Array): PdfAnalysis {
  const doc = open(buf);
  const pages = doc.countPages();
  const raw: Array<{ page: number; bbox: Rect; w: number; h: number; img: mupdf.Image; pageH: number; pageW: number }> = [];
  for (let i = 0; i < pages; i++) {
    const page = doc.loadPage(i);
    const [, , pw, ph] = page.getBounds();
    page.toStructuredText("preserve-images").walk({
      onImageBlock(bbox: Rect, _m: unknown, img: mupdf.Image) {
        raw.push({ page: i, bbox: bbox.map((v) => Math.round(v)) as Rect, w: img.getWidth(), h: img.getHeight(), img, pageH: ph, pageW: pw });
      },
    });
  }
  // Logos repeat at the same spot across pages, or sit small in a header/footer band.
  const posKey = (r: (typeof raw)[number]) => r.bbox.map((v) => Math.round(v / 6)).join(",");
  const repeats = new Map<string, number>();
  for (const r of raw) repeats.set(posKey(r), (repeats.get(posKey(r)) || 0) + 1);

  const images = raw.map((r, idx) => {
    const [x0, y0, x1, y1] = r.bbox;
    const area = ((x1 - x0) * (y1 - y0)) / (r.pageW * r.pageH);
    const inBand = y1 < r.pageH * 0.16 || y0 > r.pageH * 0.84;
    const repeated = (repeats.get(posKey(r)) || 0) >= 3;
    let reason: string | undefined;
    if (repeated && area < 0.2) reason = `Repeats on ${repeats.get(posKey(r))} pages (likely a logo)`;
    else if (inBand && area < 0.08) reason = "Small image in header/footer (likely a logo)";
    let png: Uint8Array | undefined;
    try {
      if (r.w * r.h <= 4_000_000) png = r.img.toPixmap().asPNG();
    } catch {
      png = undefined;
    }
    return {
      id: `p${r.page}-${idx}`,
      page: r.page,
      bbox: r.bbox,
      width: r.w,
      height: r.h,
      suggested: Boolean(reason),
      reason,
      png,
    };
  });
  return { text: pdfText(buf), pages, images };
}

export function renderPdfPages(buf: Uint8Array, maxPages = 40, scale = 0.8): Uint8Array[] {
  const doc = open(buf);
  const out: Uint8Array[] = [];
  for (let i = 0; i < Math.min(doc.countPages(), maxPages); i++) {
    out.push(doc.loadPage(i).toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true).asPNG());
  }
  return out;
}

interface CharStyle {
  x: number;
  y: number;
  size: number;
  color: [number, number, number];
  bold: boolean;
  italic: boolean;
  /** x where the next word starts (or page edge): how far a label may grow. */
  room: number;
}

function pageChars(page: mupdf.PDFPage) {
  const chars: Array<{ c: string; x: number; y: number; q: number[]; size: number; color: number[]; font: mupdf.Font }> = [];
  page.toStructuredText("").walk({
    onChar(c: string, origin: [number, number], font: mupdf.Font, size: number, quad: number[], color: number[]) {
      chars.push({ c, x: origin[0], y: origin[1], q: quad, size, color, font });
    },
  });
  return chars;
}

function styleFor(chars: ReturnType<typeof pageChars>, rect: Rect, pageW: number): CharStyle | null {
  const inside = (ch: (typeof chars)[number]) => {
    const cx = (ch.q[0] + ch.q[2]) / 2;
    const cy = (ch.q[1] + ch.q[5]) / 2;
    return cx >= rect[0] - 0.5 && cx <= rect[2] + 0.5 && cy >= rect[1] - 0.5 && cy <= rect[3] + 0.5;
  };
  // The visible character closest to where the hit starts (pages often carry stray
  // whitespace runs in other fonts that overlap the same box).
  let idx = -1;
  let best = Infinity;
  chars.forEach((ch, k) => {
    if (!ch.c.trim() || !inside(ch)) return;
    const d = Math.abs(ch.q[0] - rect[0]) + Math.abs(ch.q[1] - rect[1]);
    if (d < best) {
      best = d;
      idx = k;
    }
  });
  if (idx < 0) return null;
  const first = chars[idx];
  let last = idx;
  while (last + 1 < chars.length && inside(chars[last + 1]) && Math.abs(chars[last + 1].y - first.y) < 1) last++;
  // Room: up to the next visible character on the same baseline (keep a small gap).
  let room = pageW - 20;
  for (let k = last + 1; k < chars.length; k++) {
    if (Math.abs(chars[k].y - first.y) > 1) break;
    if (chars[k].c.trim()) {
      room = Math.min(chars[k].q[0] - 2, room);
      break;
    }
  }
  const name = first.font.getName();
  const col = (first.color.length >= 3 ? first.color.slice(0, 3) : [first.color[0] ?? 0, first.color[0] ?? 0, first.color[0] ?? 0]) as [number, number, number];
  return {
    x: first.q[0],
    y: first.y,
    size: first.size,
    color: col,
    bold: first.font.isBold() || /bold|black|heavy|semibold/i.test(name),
    italic: first.font.isItalic() || /italic|oblique/i.test(name),
    room,
  };
}

const quadBounds = (quads: number[][]): Rect => {
  const xs = quads.flatMap((q) => [q[0], q[2], q[4], q[6]]);
  const ys = quads.flatMap((q) => [q[1], q[3], q[5], q[7]]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

/**
 * True redaction: matched text is removed from the content stream (not just
 * covered), replacement text is drawn in its place, chosen images are blanked
 * pixel-by-pixel, matching links are dropped and metadata is cleared.
 */
export async function cleanPdf(buf: Uint8Array, findings: Finding[], images: ImageItem[]): Promise<{ pdf: Uint8Array; replaced: number }> {
  const doc = open(buf);
  const enabled = findings.filter((f) => f.enabled);
  // mupdf search is case-sensitive: search each spelling actually seen in the text.
  const needles: Array<{ needle: string; replacement: string }> = [];
  for (const f of enabled) for (const v of new Set([...f.variants, f.text])) needles.push({ needle: v, replacement: f.replacement });
  needles.sort((a, b) => b.needle.length - a.needle.length);

  const labels: Array<{ page: number; rect: Rect; text: string; style: CharStyle | null }> = [];
  let replaced = 0;

  for (let i = 0; i < doc.countPages(); i++) {
    const page = doc.loadPage(i) as mupdf.PDFPage;
    const pageW = page.getBounds()[2];
    const chars = pageChars(page);
    const taken: Rect[] = [];
    let textRedactions = 0;
    for (const { needle, replacement } of needles) {
      for (const quads of page.search(needle, undefined)) {
        const rect = quadBounds(quads as unknown as number[][]);
        // Skip hits inside an area already redacted by a longer term.
        if (taken.some((t) => rect[0] >= t[0] - 1 && rect[2] <= t[2] + 1 && rect[1] >= t[1] - 1 && rect[3] <= t[3] + 1)) continue;
        taken.push(rect);
        const annot = page.createAnnotation("Redact");
        annot.setQuadPoints(quads);
        labels.push({ page: i, rect, text: replacement, style: styleFor(chars, rect, pageW) });
        textRedactions++;
      }
    }
    if (textRedactions) {
      page.applyRedactions(false, mupdf.PDFPage.REDACT_IMAGE_NONE, mupdf.PDFPage.REDACT_LINE_ART_NONE, mupdf.PDFPage.REDACT_TEXT_REMOVE);
      replaced += textRedactions;
    }
    const pageImages = images.filter((im) => im.redact && im.page === i && im.bbox && im.kind !== "area");
    if (pageImages.length) {
      for (const im of pageImages) page.createAnnotation("Redact").setRect(im.bbox!);
      page.applyRedactions(false, mupdf.PDFPage.REDACT_IMAGE_PIXELS, mupdf.PDFPage.REDACT_LINE_ART_NONE, mupdf.PDFPage.REDACT_TEXT_NONE);
    }
    // Areas drawn by the reviewer: remove everything underneath (text, vector art, image pixels).
    const areas = images.filter((im) => im.redact && im.page === i && im.bbox && im.kind === "area");
    if (areas.length) {
      for (const im of areas) page.createAnnotation("Redact").setRect(im.bbox!);
      page.applyRedactions(false, mupdf.PDFPage.REDACT_IMAGE_PIXELS, mupdf.PDFPage.REDACT_LINE_ART_REMOVE_IF_COVERED, mupdf.PDFPage.REDACT_TEXT_REMOVE);
    }
    // Drop links that point at anything we are removing.
    for (const link of page.getLinks()) {
      const uri = link.getURI() || "";
      if (uri && enabled.some((f) => [f.text, ...f.variants].some((v) => uri.toLowerCase().includes(v.toLowerCase())))) page.deleteLink(link);
    }
  }
  for (const k of ["info:Title", "info:Author", "info:Subject", "info:Keywords", "info:Creator", "info:Producer"]) doc.setMetaData(k, "");
  const redacted = doc.saveToBuffer("garbage=3,compress").asUint8Array();

  const out = await PDFDocument.load(redacted);
  out.catalog.delete(PDFName.of("Outlines"));
  out.catalog.delete(PDFName.of("Metadata"));
  out.setTitle("");
  out.setAuthor("");
  out.setSubject("");
  out.setKeywords([]);
  out.setCreator("Blueprint Studio");
  out.setProducer("Blueprint Studio");
  const fonts = {
    regular: await out.embedFont(StandardFonts.Helvetica),
    bold: await out.embedFont(StandardFonts.HelveticaBold),
    italic: await out.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await out.embedFont(StandardFonts.HelveticaBoldOblique),
  };
  for (const l of labels) {
    const page = out.getPage(l.page);
    const H = page.getHeight();
    const [x0, y0, x1, y1] = l.rect;
    const st = l.style;
    const font = st ? (st.bold && st.italic ? fonts.boldItalic : st.bold ? fonts.bold : st.italic ? fonts.italic : fonts.regular) : fonts.regular;
    const base = st ? st.size : Math.max(4, (y1 - y0) * 0.78);
    // Fit the replacement in the gap the original word left; shrink to 75% before letting it run over.
    const room = st ? Math.max(x1 - x0, st.room - (st.x ?? x0)) : (x1 - x0) * 1.3;
    let size = base;
    while (size > base * 0.75 && font.widthOfTextAtSize(l.text, size) > room) size -= 0.25;
    const color = st ? rgb(st.color[0], st.color[1], st.color[2]) : rgb(0.18, 0.18, 0.2);
    page.drawText(l.text, { x: st ? st.x : x0, y: st ? H - st.y : H - y1 + (y1 - y0) * 0.22, size, font, color });
  }
  return { pdf: await out.save(), replaced };
}
