import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { getProject, mutate, newId, now, readDb, sourceDir, termsFor, updateSource } from "../store";
import type { Finding, ImageItem, Source } from "../types";
import { DEFAULT_REPLACEMENT } from "../types";
import { aiConfigured, extractEntitiesWithAi } from "./ai";
import { analyzeDocx, cleanDocx, docxText, renderDocxPages } from "./docx";
import { analyzeFigma, buildFigmaPlugin, figmaConfigured, figmaThumbnails } from "./figma";
import { detectPatterns, occurrences, residualCheck, termToFinding } from "./match";
import { analyzePdf, cleanPdf, pdfText, renderPdfPages } from "./pdf";

export const originalPath = (s: Source) => path.join(sourceDir(s.id), `original.${s.format}`);
export const cleanedPath = (s: Source) => path.join(sourceDir(s.id), s.format === "figma" ? "blueprint-cleaner.zip" : `cleaned.${s.format}`);
const previewDir = (id: string) => path.join(sourceDir(id), "preview");

async function writePreviews(id: string, prefix: "orig" | "clean", pngs: Uint8Array[]) {
  const dir = previewDir(id);
  await fs.mkdir(dir, { recursive: true });
  for (const f of await fs.readdir(dir)) if (f.startsWith(prefix + "-")) await fs.unlink(path.join(dir, f));
  await Promise.all(pngs.map((p, i) => fs.writeFile(path.join(dir, `${prefix}-${String(i + 1).padStart(3, "0")}.png`), p)));
}

export async function listPreviews(id: string, prefix: "orig" | "clean" | "img"): Promise<string[]> {
  try {
    return (await fs.readdir(previewDir(id))).filter((f) => f.startsWith(prefix + "-")).sort();
  } catch {
    return [];
  }
}

/**
 * Scan a source: extract its text and images, then build findings from the
 * dictionary (global + project terms), pattern detectors and the optional AI
 * pass. Decisions the reviewer already made (enabled / replacement) carry over.
 */
export async function scanSource(id: string): Promise<void> {
  await updateSource(id, (s) => {
    s.status = "processing";
    s.error = undefined;
  });
  try {
    const db = await readDb();
    const source = db.sources.find((s) => s.id === id)!;
    const project = await getProject(source.projectId);
    let text = "";
    let images: Array<Omit<ImageItem, "redact"> & { png?: Uint8Array; bytes?: Uint8Array; ext?: string }> = [];
    let pages: number | undefined;
    let title = source.title;

    if (source.format === "pdf") {
      const buf = new Uint8Array(await fs.readFile(originalPath(source)));
      const a = analyzePdf(buf);
      text = a.text;
      images = a.images;
      pages = a.pages;
      await writePreviews(id, "orig", renderPdfPages(buf));
    } else if (source.format === "docx") {
      const buf = new Uint8Array(await fs.readFile(originalPath(source)));
      const a = await analyzeDocx(buf);
      text = a.text;
      images = a.images.map((im) => ({ ...im, png: undefined }));
      const pngs = renderDocxPages(buf);
      pages = pngs.length || undefined;
      await writePreviews(id, "orig", pngs);
      // DOCX image previews: write the raw bytes with their own extension.
      const dir = previewDir(id);
      await fs.mkdir(dir, { recursive: true });
      for (const im of a.images) {
        if (im.bytes) {
          const name = `img-${im.id}.${im.ext}`;
          await fs.writeFile(path.join(dir, name), im.bytes);
          const target = images.find((x) => x.id === im.id)!;
          target.preview = name;
        }
      }
    } else {
      if (!figmaConfigured()) throw new Error("FIGMA_TOKEN is not set, so Figma files can't be scanned yet. Add it in .env and click Re-scan.");
      const a = await analyzeFigma(source.figmaUrl!);
      text = a.text;
      images = a.images;
      title = source.title || a.name;
      const thumbs = await figmaThumbnails(source.figmaUrl!, a.frames.map((f) => f.id)).catch(() => []);
      await writePreviews(id, "orig", thumbs.map((t) => t.png));
    }
    await fs.writeFile(path.join(sourceDir(id), "original.txt"), text);

    // PDF image previews (decoded by MuPDF).
    for (const im of images) {
      if (im.png) {
        const name = `img-${im.id}.png`;
        await fs.mkdir(previewDir(id), { recursive: true });
        await fs.writeFile(path.join(previewDir(id), name), im.png);
        im.preview = name;
      }
    }

    // ---- build findings
    const findings = new Map<string, Finding>();
    const add = (f: Finding | null) => {
      if (!f) return;
      const key = f.text.toLowerCase();
      const prev = findings.get(key);
      if (!prev) findings.set(key, f);
      else prev.variants = [...new Set([...prev.variants, ...f.variants])];
    };
    for (const t of termsFor(db, source.projectId)) add(termToFinding(t, t.scope === "global" ? "global" : "project", text, newId()));
    if (project) {
      // The project's own name is the most obvious identifier.
      add(termToFinding({ text: project.name, type: "product", replacement: DEFAULT_REPLACEMENT.product }, "project", text, newId(), "Project name"));
    }
    for (const p of detectPatterns(text)) {
      const { count, variants } = occurrences(text, p.text);
      add({ id: newId(), text: p.text, variants: variants.length ? variants : [p.text], type: p.type, replacement: p.replacement, origin: "pattern", count: count || p.count, enabled: true, reason: p.reason });
    }
    let aiUsed = false;
    let aiError: string | undefined;
    if (aiConfigured() && text.trim()) {
      try {
        const entities = await extractEntitiesWithAi(text, { project: project?.name, knownTerms: [...findings.values()].map((f) => f.text) });
        for (const e of entities) {
          if (findings.has(e.text.toLowerCase())) continue;
          add(termToFinding({ text: e.text, type: e.type, replacement: e.replacement }, "ai", text, newId(), e.reason));
        }
        aiUsed = true;
      } catch (e) {
        aiError = (e as Error).message;
      }
    }

    // Carry over reviewer decisions and manual findings from the previous scan.
    for (const old of source.findings) {
      const key = old.text.toLowerCase();
      const cur = findings.get(key);
      if (cur) {
        cur.enabled = old.enabled;
        cur.replacement = old.replacement;
        cur.type = old.type;
      } else if (old.origin === "manual") {
        const occ = occurrences(text, old.text);
        findings.set(key, { ...old, count: occ.count, variants: occ.variants.length ? occ.variants : old.variants });
      }
    }
    const oldImages = new Map(source.images.map((i) => [i.id, i.redact]));
    const finalImages: ImageItem[] = images.map(({ png: _png, bytes: _bytes, ext: _ext, ...im }) => ({ ...im, redact: oldImages.get(im.id) ?? im.suggested }));

    const order = { manual: 0, project: 1, ai: 2, global: 3, pattern: 4 } as const;
    await updateSource(id, (s) => {
      s.findings = [...findings.values()].sort((a, b) => order[a.origin] - order[b.origin] || b.count - a.count);
      s.images = finalImages;
      s.pages = pages;
      s.title = title;
      s.aiUsed = aiUsed;
      s.aiError = aiError;
    });
    await applyClean(id);
  } catch (e) {
    await updateSource(id, (s) => {
      s.status = "error";
      s.error = (e as Error).message;
      s.history.push({ at: now(), action: "error", note: (e as Error).message });
    });
  }
}

/** Produce the cleaned file from the current findings, then verify nothing identifying is left. */
export async function applyClean(id: string): Promise<void> {
  const db = await readDb();
  const source = db.sources.find((s) => s.id === id)!;
  let cleanedText = "";
  let replaced = 0;
  if (source.format === "pdf") {
    const buf = new Uint8Array(await fs.readFile(originalPath(source)));
    const r = await cleanPdf(buf, source.findings, source.images);
    await fs.writeFile(cleanedPath(source), r.pdf);
    replaced = r.replaced;
    cleanedText = pdfText(r.pdf);
    await writePreviews(id, "clean", renderPdfPages(r.pdf));
  } else if (source.format === "docx") {
    const buf = new Uint8Array(await fs.readFile(originalPath(source)));
    const r = await cleanDocx(buf, source.findings, source.images);
    await fs.writeFile(cleanedPath(source), r.docx);
    replaced = r.replaced;
    cleanedText = await docxText(r.docx);
    await writePreviews(id, "clean", renderDocxPages(r.docx));
  } else {
    await fs.writeFile(cleanedPath(source), await buildFigmaPlugin(source.title, source.findings, source.images));
    replaced = source.findings.filter((f) => f.enabled).length;
  }
  if (source.format !== "figma") await fs.writeFile(path.join(sourceDir(id), "cleaned.txt"), cleanedText);
  const residual = source.format === "figma" ? [] : residualCheck(cleanedText, source.findings);
  await updateSource(id, (s) => {
    s.residual = residual;
    s.residualCheckedAt = source.format === "figma" ? undefined : now();
    s.cleanedAt = now();
    s.status = "needs_review";
    s.history.push({ at: now(), action: "cleaned", note: `${replaced} replacement${replaced === 1 ? "" : "s"}${residual.length ? `, ${residual.length} possible leftover${residual.length === 1 ? "" : "s"}` : ", no leftovers found"}` });
  });
}

/** Figma: re-scan the reviewer's cleaned duplicate and report anything still present. */
export async function verifyFigma(id: string, cleanedUrl: string): Promise<void> {
  const a = await analyzeFigma(cleanedUrl);
  const source = (await readDb()).sources.find((s) => s.id === id)!;
  const residual = residualCheck(a.text, source.findings);
  const thumbs = await figmaThumbnails(cleanedUrl, a.frames.map((f) => f.id)).catch(() => []);
  await writePreviews(id, "clean", thumbs.map((t) => t.png));
  await fs.writeFile(path.join(sourceDir(id), "cleaned.txt"), a.text);
  await updateSource(id, (s) => {
    s.cleanedFigmaUrl = cleanedUrl;
    s.residual = residual;
    s.residualCheckedAt = now();
    s.history.push({ at: now(), action: "cleaned", note: `Verified cleaned duplicate: ${residual.length ? residual.length + " possible leftovers" : "no leftovers found"}` });
  });
}

export async function createSource(input: Omit<Source, "id" | "status" | "findings" | "images" | "residual" | "aiUsed" | "history" | "createdAt" | "updatedAt">, file?: Uint8Array): Promise<Source> {
  const id = newId();
  const t = now();
  const source: Source = { ...input, id, status: "processing", findings: [], images: [], residual: [], aiUsed: false, history: [{ at: t, action: "uploaded" }], createdAt: t, updatedAt: t };
  await fs.mkdir(sourceDir(id), { recursive: true });
  if (file) await fs.writeFile(originalPath(source), file);
  await mutate((db) => {
    db.sources.unshift(source);
  });
  return source;
}
