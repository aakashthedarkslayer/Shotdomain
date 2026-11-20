import { after } from "next/server";
import { adminOr401 } from "@/lib/auth";
import { createSource, scanSource } from "@/lib/clean/pipeline";
import { figmaFileKey } from "@/lib/clean/figma";
import type { SourceKind } from "@/lib/types";

export const maxDuration = 300;

const KINDS: SourceKind[] = ["proposal", "case_study", "figma", "other"];
const MAX_BYTES = 80 * 1024 * 1024;

/** Multipart upload: files[] (PDF/DOCX) and/or figmaUrls (one per line). Cleaning runs after the response. */
export async function POST(request: Request) {
  const denied = await adminOr401();
  if (denied) return denied;
  const form = await request.formData();
  const kind = KINDS.includes(form.get("kind") as SourceKind) ? (form.get("kind") as SourceKind) : "other";
  const projectId = String(form.get("projectId") || "") || undefined;
  const created: Array<{ id: string; title: string }> = [];
  const rejected: Array<{ name: string; reason: string }> = [];

  for (const entry of form.getAll("files")) {
    if (!(entry instanceof File) || !entry.size) continue;
    const name = entry.name;
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      rejected.push({ name, reason: ext === "doc" ? "Old .doc format: save it as .docx first" : "Only PDF and DOCX files can be cleaned" });
      continue;
    }
    if (entry.size > MAX_BYTES) {
      rejected.push({ name, reason: "Larger than 80 MB" });
      continue;
    }
    const bytes = new Uint8Array(await entry.arrayBuffer());
    const looksRight = ext === "pdf" ? bytes[0] === 0x25 && bytes[1] === 0x50 : bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (!looksRight) {
      rejected.push({ name, reason: `Not a valid ${ext.toUpperCase()} file` });
      continue;
    }
    const s = await createSource({ kind: kind === "figma" ? "other" : kind, title: name.replace(/\.(pdf|docx)$/i, ""), format: ext, fileName: name, projectId }, bytes);
    created.push({ id: s.id, title: s.title });
  }

  for (const line of String(form.get("figmaUrls") || "").split(/\s+/).map((s) => s.trim()).filter(Boolean)) {
    if (!figmaFileKey(line)) {
      rejected.push({ name: line, reason: "Not a Figma file link" });
      continue;
    }
    const s = await createSource({ kind: "figma", title: "", format: "figma", figmaUrl: line, projectId });
    created.push({ id: s.id, title: line });
  }

  // Clean one at a time after responding so a batch doesn't hammer the CPU.
  after(async () => {
    for (const c of created) await scanSource(c.id);
  });
  return Response.json({ created, rejected });
}
