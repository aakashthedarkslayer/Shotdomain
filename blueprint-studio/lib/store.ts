import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Db, Project, Source, Term } from "./types";
import { DEFAULT_REPLACEMENT } from "./types";

// Runtime data folder (uploads, cleaned files, db.json); excluded from build tracing.
export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(process.cwd(), "data"));
const DB_FILE = path.join(DATA_DIR, "db.json");

export const sourceDir = (id: string) => path.join(DATA_DIR, "files", id);

export const newId = () => randomUUID().slice(0, 8) + randomUUID().slice(0, 4);
export const now = () => new Date().toISOString();

/** Agency branding that should come out of every document by default. */
const SEED_GLOBAL_TERMS: Array<Pick<Term, "text" | "type">> = [
  { text: "Dotsquares Ltd", type: "agency" },
  { text: "Dotsquares", type: "agency" },
  { text: "dotsquares.com", type: "url" },
  { text: "24livehost.com", type: "url" },
  { text: "projectstatus.in", type: "url" },
  { text: "teaminindia.com", type: "url" },
];

function emptyDb(): Db {
  const t = now();
  return {
    projects: [],
    sources: [],
    terms: SEED_GLOBAL_TERMS.map((s) => ({
      id: newId(),
      text: s.text,
      type: s.type,
      replacement: DEFAULT_REPLACEMENT[s.type],
      scope: "global",
      enabled: true,
      createdAt: t,
    })),
  };
}

// Route handlers and pages can run as separate module instances, so the file on
// disk is the source of truth: the cache is only reused while its mtime matches,
// and writes take a lock file so instances never overwrite each other.
let cache: { db: Db; mtimeMs: number } | null = null;
let writeChain: Promise<void> = Promise.resolve();
const LOCK_FILE = DB_FILE + ".lock";

async function load(): Promise<Db> {
  try {
    const st = await fs.stat(DB_FILE);
    if (cache && cache.mtimeMs === st.mtimeMs) return cache.db;
    const db = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db;
    cache = { db, mtimeMs: st.mtimeMs };
    return db;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const db = emptyDb();
    await persist(db);
    return db;
  }
}

async function persist(db: Db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 1));
  await fs.rename(tmp, DB_FILE);
  const st = await fs.stat(DB_FILE);
  cache = { db, mtimeMs: st.mtimeMs };
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (let attempt = 0; ; attempt++) {
    try {
      const h = await fs.open(LOCK_FILE, "wx");
      await h.close();
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      // A lock older than 30 s belongs to a crashed process.
      const st = await fs.stat(LOCK_FILE).catch(() => null);
      if (st && Date.now() - st.mtimeMs > 30_000) await fs.rm(LOCK_FILE, { force: true });
      if (attempt > 600) throw new Error("Database is busy, try again.");
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  try {
    return await fn();
  } finally {
    await fs.rm(LOCK_FILE, { force: true });
  }
}

export async function readDb(): Promise<Db> {
  return structuredClone(await load());
}

/** Serialised read-modify-write so concurrent requests never clobber each other. */
export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = writeChain.then(() =>
    withLock(async () => {
      const db = structuredClone(await load());
      const result = await fn(db);
      await persist(db);
      return result;
    }),
  );
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function getSource(id: string): Promise<Source | undefined> {
  return (await readDb()).sources.find((s) => s.id === id);
}

export async function getProject(id: string | undefined): Promise<Project | undefined> {
  if (!id) return undefined;
  return (await readDb()).projects.find((p) => p.id === id);
}

export async function updateSource(id: string, patch: (s: Source) => void): Promise<Source> {
  return mutate((db) => {
    const s = db.sources.find((x) => x.id === id);
    if (!s) throw new Error("Source not found");
    patch(s);
    s.updatedAt = now();
    return structuredClone(s);
  });
}

/** Terms that apply to a source: enabled global terms plus its project's terms. */
export function termsFor(db: Db, projectId?: string): Term[] {
  return db.terms.filter(
    (t) => t.enabled && (t.scope === "global" || (projectId && t.projectId === projectId)),
  );
}
