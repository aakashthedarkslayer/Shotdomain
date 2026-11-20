/**
 * End-to-end check of the cleaning engine without the web UI.
 *   npx tsx --conditions=react-server scripts/test-clean.ts <file.pdf|file.docx> "<Project name>" "term1,term2"
 * Uses a throwaway DATA_DIR so the real database is untouched.
 */
import { promises as fs } from "fs";
import os from "os";
import path from "path";

async function main() {
  const [file, projectName, extra] = process.argv.slice(2);
  if (!file) throw new Error("usage: test-clean.ts <file> [project] [terms]");
  process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "bs-test-"));
  const store = await import("../lib/store");
  const { createSource, scanSource, cleanedPath } = await import("../lib/clean/pipeline");

  const projectId = store.newId();
  await store.mutate((db) => {
    db.projects.push({ id: projectId, name: projectName || "Test project", createdAt: store.now() });
    for (const t of (extra || "").split(",").map((s) => s.trim()).filter(Boolean)) {
      db.terms.push({ id: store.newId(), text: t, type: "client", replacement: "the Client", scope: "project", projectId, enabled: true, createdAt: store.now() });
    }
  });
  const format = file.endsWith(".pdf") ? "pdf" : "docx";
  const src = await createSource({ kind: "proposal", title: path.basename(file), format, fileName: path.basename(file), projectId }, new Uint8Array(await fs.readFile(file)));
  await scanSource(src.id);
  const s = (await store.getSource(src.id))!;
  console.log("status:", s.status, s.error || "", "| pages:", s.pages, "| ai:", s.aiUsed, s.aiError || "");
  console.log("\nFindings:");
  for (const f of s.findings) console.log(`  [${f.origin}] ${f.type.padEnd(9)} ${JSON.stringify(f.text)} x${f.count} -> ${JSON.stringify(f.replacement)} ${f.variants.length > 1 ? "variants=" + JSON.stringify(f.variants) : ""}`);
  console.log("\nImages:");
  for (const im of s.images) console.log(`  ${im.id} ${im.width}x${im.height} page=${im.page ?? "-"} suggested=${im.suggested} ${im.reason || ""}`);
  console.log("\nResidual:", s.residual.length ? "" : "none");
  for (const r of s.residual) console.log(`  ${JSON.stringify(r.text)} x${r.count}: …${r.context}…`);
  console.log("\nHistory:", s.history.map((h) => `${h.action}: ${h.note || ""}`).join(" | "));
  const out = cleanedPath(s);
  const keep = path.join(path.dirname(file), "out-" + path.basename(out).replace("cleaned", path.basename(file, path.extname(file))));
  await fs.copyFile(out, keep);
  console.log("\nCleaned file:", keep, "\nData dir:", process.env.DATA_DIR);
}
main().catch((e) => { console.error(e); process.exit(1); });
