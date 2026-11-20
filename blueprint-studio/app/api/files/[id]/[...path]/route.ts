import { promises as fs } from "fs";
import path from "path";
import { adminOr401 } from "@/lib/auth";
import { cleanedPath, originalPath } from "@/lib/clean/pipeline";
import { getSource, sourceDir } from "@/lib/store";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  zip: "application/zip",
  txt: "text/plain; charset=utf-8",
};

const safeName = (s: string) => s.replace(/[^\w.\- ]+/g, "_").slice(0, 120);

/** /api/files/<id>/original | cleaned | text/original | text/cleaned | preview/<file> */
export async function GET(_req: Request, ctx: RouteContext<"/api/files/[id]/[...path]">) {
  const denied = await adminOr401();
  if (denied) return denied;
  const { id, path: parts } = await ctx.params;
  const source = await getSource(id);
  if (!source) return new Response("Not found", { status: 404 });

  let file: string;
  let downloadName: string | undefined;
  const [what, extra] = parts;
  if (what === "original" && source.format !== "figma") {
    file = originalPath(source);
    downloadName = source.fileName || `original.${source.format}`;
  } else if (what === "cleaned") {
    file = cleanedPath(source);
    const base = safeName(source.title || "document");
    downloadName = source.format === "figma" ? `${base} - blueprint-cleaner.zip` : `${base} (clean).${source.format}`;
  } else if (what === "text" && (extra === "original" || extra === "cleaned")) {
    file = path.join(sourceDir(id), `${extra}.txt`);
  } else if (what === "preview" && extra && /^[\w.\-]+$/.test(extra)) {
    file = path.join(sourceDir(id), "preview", extra);
  } else {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(/*turbopackIgnore: true*/ file);
    const ext = file.split(".").pop()!.toLowerCase();
    const headers: Record<string, string> = { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "private, no-store" };
    if (downloadName) headers["Content-Disposition"] = `attachment; filename="${safeName(downloadName)}"`;
    return new Response(new Uint8Array(data), { headers });
  } catch {
    return new Response("Not ready yet", { status: 404 });
  }
}
