"use server";

import { promises as fs } from "fs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { applyClean, scanSource, verifyFigma } from "@/lib/clean/pipeline";
import { occurrences } from "@/lib/clean/match";
import { createSessionValue, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { mutate, newId, now, sourceDir, updateSource } from "@/lib/store";
import type { Finding, ImageItem, SourceKind, Term, TermType } from "@/lib/types";
import { DEFAULT_REPLACEMENT } from "@/lib/types";
import path from "path";

// ---------------------------------------------------------------- auth

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "ADMIN_PASSWORD is not set on the server.";
  if (String(form.get("password") || "") !== expected) return "Wrong password.";
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionValue(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_MAX_AGE, path: "/" });
  const next = String(form.get("next") || "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------------------------------------------------------------- review

export interface FindingEdit {
  id: string;
  enabled: boolean;
  replacement: string;
  type: TermType;
  /** Also save this finding to the dictionary so future uploads catch it. */
  remember?: "project" | "global";
}

/** Save the reviewer's decisions and regenerate the cleaned output. */
export async function saveReview(sourceId: string, edits: FindingEdit[], imageRedactions: Record<string, boolean>, newAreas: ImageItem[], removedAreaIds: string[]) {
  await requireAdmin();
  const remember: Term[] = [];
  const source = await updateSource(sourceId, (s) => {
    for (const e of edits) {
      const f = s.findings.find((x) => x.id === e.id);
      if (!f) continue;
      f.enabled = e.enabled;
      f.replacement = e.replacement.trim() || DEFAULT_REPLACEMENT[e.type];
      f.type = e.type;
      if (e.remember) remember.push({ id: newId(), text: f.text, type: f.type, replacement: f.replacement, scope: e.remember, projectId: e.remember === "project" ? s.projectId : undefined, enabled: true, createdAt: now() });
    }
    for (const im of s.images) if (im.id in imageRedactions) im.redact = imageRedactions[im.id];
    s.images = s.images.filter((im) => !removedAreaIds.includes(im.id));
    for (const a of newAreas) s.images.push({ ...a, id: "area-" + newId(), kind: "area", redact: true, suggested: false });
  });
  if (remember.length) {
    await mutate((db) => {
      for (const t of remember) {
        if (t.scope === "project" && !t.projectId) t.scope = "global";
        const dup = db.terms.find((x) => x.text.toLowerCase() === t.text.toLowerCase() && x.scope === t.scope && x.projectId === t.projectId);
        if (dup) Object.assign(dup, { replacement: t.replacement, type: t.type, enabled: true });
        else db.terms.push(t);
      }
    });
  }
  await applyClean(source.id);
  revalidatePath(`/sources/${sourceId}`);
}

/** Add a term the scan missed (e.g. a person's name) straight from the review screen. */
export async function addManualFinding(sourceId: string, form: FormData) {
  await requireAdmin();
  const text = String(form.get("text") || "").trim();
  if (text.length < 2) return;
  const type = (String(form.get("type") || "other") as TermType) || "other";
  const replacement = String(form.get("replacement") || "").trim() || DEFAULT_REPLACEMENT[type];
  const scope = String(form.get("remember") || "");
  const original = await fs.readFile(path.join(sourceDir(sourceId), "original.txt"), "utf8").catch(() => "");
  const occ = occurrences(original, text);
  const s = await updateSource(sourceId, (s) => {
    const existing = s.findings.find((f) => f.text.toLowerCase() === text.toLowerCase());
    if (existing) Object.assign(existing, { enabled: true, replacement, type });
    else s.findings.unshift({ id: newId(), text, variants: occ.variants.length ? occ.variants : [text], type, replacement, origin: "manual", count: occ.count, enabled: true, reason: "Added by reviewer" } satisfies Finding);
  });
  if (scope === "project" || scope === "global") {
    await mutate((db) => {
      db.terms.push({ id: newId(), text, type, replacement, scope: scope === "project" && s.projectId ? "project" : "global", projectId: scope === "project" ? s.projectId : undefined, enabled: true, createdAt: now() });
    });
  }
  await applyClean(sourceId);
  revalidatePath(`/sources/${sourceId}`);
}

export async function rescan(sourceId: string) {
  await requireAdmin();
  await updateSource(sourceId, (s) => {
    s.status = "processing";
  });
  after(() => scanSource(sourceId));
  revalidatePath(`/sources/${sourceId}`);
}

export async function setDecision(sourceId: string, form: FormData) {
  await requireAdmin();
  const decision = String(form.get("decision"));
  const note = String(form.get("note") || "").trim() || undefined;
  await updateSource(sourceId, (s) => {
    if (decision === "approve") {
      if (s.residual.length && form.get("override") !== "on") throw new Error("This copy still has possible leftovers. Tick the override box if they are fine.");
      s.status = "approved";
      s.history.push({ at: now(), action: "approved", note });
    } else if (decision === "changes") {
      s.status = "changes_requested";
      s.history.push({ at: now(), action: "changes_requested", note });
    } else if (decision === "reopen") {
      s.status = "needs_review";
      s.history.push({ at: now(), action: "reopened", note });
    } else if (decision === "note" && note) {
      s.history.push({ at: now(), action: "note", note });
    }
  });
  revalidatePath(`/sources/${sourceId}`);
  revalidatePath("/sources");
  revalidatePath("/");
}

export async function updateSourceMeta(sourceId: string, form: FormData) {
  await requireAdmin();
  const projectId = String(form.get("projectId") || "") || undefined;
  const kind = String(form.get("kind") || "") as SourceKind;
  const title = String(form.get("title") || "").trim();
  let projectChanged = false;
  await updateSource(sourceId, (s) => {
    projectChanged = s.projectId !== projectId;
    s.projectId = projectId;
    if (kind) s.kind = kind;
    if (title) s.title = title;
  });
  // A different project brings different dictionary terms: scan again.
  if (projectChanged) after(() => scanSource(sourceId));
  revalidatePath(`/sources/${sourceId}`);
}

export async function verifyFigmaAction(sourceId: string, form: FormData) {
  await requireAdmin();
  const url = String(form.get("cleanedUrl") || "").trim();
  if (!url) return;
  await verifyFigma(sourceId, url);
  revalidatePath(`/sources/${sourceId}`);
}

export async function deleteSource(sourceId: string) {
  await requireAdmin();
  await mutate((db) => {
    db.sources = db.sources.filter((s) => s.id !== sourceId);
  });
  await fs.rm(sourceDir(sourceId), { recursive: true, force: true });
  revalidatePath("/sources");
  redirect("/sources");
}

// ---------------------------------------------------------------- dictionary

export async function saveTerm(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || "");
  const text = String(form.get("text") || "").trim();
  const type = String(form.get("type") || "client") as TermType;
  const replacement = String(form.get("replacement") || "").trim() || DEFAULT_REPLACEMENT[type];
  const projectId = String(form.get("projectId") || "") || undefined;
  const enabled = form.get("enabled") !== "off";
  if (text.length < 2) return;
  await mutate((db) => {
    const existing = id ? db.terms.find((t) => t.id === id) : undefined;
    if (existing) Object.assign(existing, { text, type, replacement, projectId, scope: projectId ? "project" : "global", enabled });
    else db.terms.push({ id: newId(), text, type, replacement, scope: projectId ? "project" : "global", projectId, enabled: true, createdAt: now() });
  });
  revalidatePath("/terms");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function deleteTerm(id: string) {
  await requireAdmin();
  await mutate((db) => {
    db.terms = db.terms.filter((t) => t.id !== id);
  });
  revalidatePath("/terms");
}

export async function toggleTerm(id: string) {
  await requireAdmin();
  await mutate((db) => {
    const t = db.terms.find((x) => x.id === id);
    if (t) t.enabled = !t.enabled;
  });
  revalidatePath("/terms");
}

// ---------------------------------------------------------------- projects

export async function createProject(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") || "").trim();
  if (!name) return;
  const aliases = String(form.get("aliases") || "").split(/[,\n]/).map((s) => s.trim()).filter((s) => s.length > 1);
  const id = newId();
  await mutate((db) => {
    db.projects.push({ id, name, industry: String(form.get("industry") || "").trim() || undefined, country: String(form.get("country") || "").trim() || undefined, createdAt: now() });
    for (const a of aliases) db.terms.push({ id: newId(), text: a, type: "client", replacement: DEFAULT_REPLACEMENT.client, scope: "project", projectId: id, enabled: true, createdAt: now() });
  });
  revalidatePath("/projects");
  redirect(`/projects/${id}`);
}

const hostOf = (u: string) => {
  try {
    const h = new URL(/^https?:\/\//.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "");
    return /(apple\.com|google\.com|play\.google|herokuapp\.com|24livehost\.com|projectstatus\.in|figma\.com|sharepoint\.com|amazonaws\.com|web\.app)$/.test(h) ? null : h;
  } catch {
    return null;
  }
};

/**
 * Import the portfolio master catalog (JSON exported earlier). Each row becomes a
 * project; client contacts and live-site domains become that project's terms.
 */
export async function importCatalog(_prev: string | null, form: FormData): Promise<string | null> {
  await requireAdmin();
  const file = form.get("catalog");
  if (!(file instanceof File) || !file.size) return "Choose the portfolio_master.json file first.";
  let rows: Array<Record<string, unknown>>;
  try {
    rows = JSON.parse(await file.text());
    if (!Array.isArray(rows)) throw new Error();
  } catch {
    return "That file isn't a JSON array of projects.";
  }
  let created = 0;
  let terms = 0;
  await mutate((db) => {
    for (const r of rows) {
      const name = String(r["Project Name"] || r.name || "").trim();
      if (!name) continue;
      const catalogId = String(r.ID || r.id || "");
      let p = db.projects.find((x) => (catalogId && x.catalogId === catalogId) || x.name.toLowerCase() === name.toLowerCase());
      if (!p) {
        p = { id: newId(), name, catalogId: catalogId || undefined, industry: String(r["Industry (normalised)"] || "") || undefined, country: String(r.Country || "") || undefined, createdAt: now() };
        db.projects.push(p);
        created++;
      }
      const add = (text: string, type: TermType) => {
        text = text.trim();
        if (text.length < 3 || db.terms.some((t) => t.projectId === p!.id && t.text.toLowerCase() === text.toLowerCase())) return;
        db.terms.push({ id: newId(), text, type, replacement: DEFAULT_REPLACEMENT[type], scope: "project", projectId: p!.id, enabled: true, createdAt: now() });
        terms++;
      };
      const contact = String(r["Client Contact"] || "");
      if (contact && !/^(na|n\/a|-)$/i.test(contact)) add(contact, "person");
      for (const u of String(r["Live Link"] || "").split(/\s*\|\s*|\s+/)) {
        const h = hostOf(u);
        if (h) add(h, "url");
      }
      // Short brand form of the project name, e.g. "LimoMate" from "Website and app for MY LIMO MATE".
      const short = name.replace(/\s*[-–|:(].*$/, "").replace(/\b(app|application|development|project|website|web|mobile|platform|phase\s*\d+)\b/gi, "").replace(/\s+/g, " ").trim();
      if (short && short.toLowerCase() !== name.toLowerCase()) add(short, "product");
    }
  });
  revalidatePath("/projects");
  return `Imported ${rows.length} rows: ${created} new projects, ${terms} dictionary terms.`;
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await mutate((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
    db.terms = db.terms.filter((t) => t.projectId !== id);
    for (const s of db.sources) if (s.projectId === id) s.projectId = undefined;
  });
  revalidatePath("/projects");
  redirect("/projects");
}
