import "server-only";
import JSZip from "jszip";
import type { Finding, ImageItem } from "../types";

export const figmaConfigured = () => Boolean(process.env.FIGMA_TOKEN);

export function figmaFileKey(url: string): string | null {
  const m = url.match(/figma\.com\/(?:file|design|proto|board)\/([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  characters?: string;
  children?: FigmaNode[];
  fills?: Array<{ type: string }>;
}

async function figmaGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.figma.com/v1${path}`, { headers: { "X-Figma-Token": process.env.FIGMA_TOKEN || "" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 403) throw new Error("Figma refused access (403). The token's account needs at least view access to this file.");
    if (res.status === 404) throw new Error("Figma file not found (404). Check the link.");
    throw new Error(`Figma API error ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export interface FigmaAnalysis {
  name: string;
  text: string;
  frames: Array<{ id: string; name: string; page: string }>;
  images: Array<Omit<ImageItem, "redact">>;
}

/** Text of every text layer plus layer/page names (buyers of the .fig see layer names too). */
export async function analyzeFigma(url: string): Promise<FigmaAnalysis> {
  const key = figmaFileKey(url);
  if (!key) throw new Error("That doesn't look like a Figma file link.");
  const file = await figmaGet<{ name: string; document: FigmaNode }>(`/files/${key}`);
  const lines: string[] = [`File: ${file.name}`];
  const frames: FigmaAnalysis["frames"] = [];
  const images: FigmaAnalysis["images"] = [];
  const walk = (n: FigmaNode, page: string, depth: number) => {
    if (n.type === "CANVAS") lines.push(`\n[Page] ${n.name}`);
    else lines.push(`[Layer] ${n.name}`);
    if (n.type === "TEXT" && n.characters) lines.push(n.characters);
    if (depth === 2 && (n.type === "FRAME" || n.type === "COMPONENT" || n.type === "SECTION")) frames.push({ id: n.id, name: n.name, page });
    const hasImageFill = n.fills?.some((f) => f.type === "IMAGE");
    if (/logo|brand|wordmark/i.test(n.name) || (hasImageFill && /logo/i.test(n.name))) {
      images.push({ id: n.id, width: 0, height: 0, suggested: true, reason: `Layer named "${n.name}"`, part: n.name });
    }
    for (const c of n.children || []) walk(c, n.type === "CANVAS" ? n.name : page, depth + 1);
  };
  walk(file.document, "", 0);
  return { name: file.name, text: lines.join("\n"), frames, images };
}

/** PNG thumbnails of the first top-level frames, for the review screen. */
export async function figmaThumbnails(url: string, frameIds: string[]): Promise<Array<{ id: string; png: Uint8Array }>> {
  const key = figmaFileKey(url);
  if (!key || !frameIds.length) return [];
  const ids = frameIds.slice(0, 12);
  const res = await figmaGet<{ images: Record<string, string | null> }>(`/images/${key}?ids=${encodeURIComponent(ids.join(","))}&format=png&scale=0.5`);
  const out: Array<{ id: string; png: Uint8Array }> = [];
  for (const id of ids) {
    const src = res.images[id];
    if (!src) continue;
    const img = await fetch(src);
    if (img.ok) out.push({ id, png: new Uint8Array(await img.arrayBuffer()) });
  }
  return out;
}

/** A dev plugin the reviewer runs inside an editable duplicate. Replacements are baked in. */
export async function buildFigmaPlugin(sourceTitle: string, findings: Finding[], images: ImageItem[]): Promise<Uint8Array> {
  const plan = {
    title: sourceTitle,
    replacements: findings
      .filter((f) => f.enabled)
      .flatMap((f) => [...new Set([f.text, ...f.variants])].map((t) => ({ find: t, replace: f.replacement })))
      .sort((a, b) => b.find.length - a.find.length),
    hideNodeIds: images.filter((i) => i.redact).map((i) => i.id),
  };
  const manifest = {
    name: "Blueprint Cleaner",
    id: "blueprint-cleaner-local",
    api: "1.0.0",
    main: "code.js",
    editorType: ["figma"],
    documentAccess: "dynamic-page",
  };
  const code = `// Blueprint Cleaner: replaces client names in text layers and layer names,
// and blanks logo layers. Run it in an editable DUPLICATE, never the original.
const PLAN = ${JSON.stringify(plan, null, 2)};
const esc = (s) => s.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
const pattern = (t) => t.trim().split(/\\s+/).map(esc).join("[\\\\s\\\\u00a0]*");
const RULES = PLAN.replacements.map((r) => ({ re: new RegExp("(?<![\\\\p{L}\\\\p{N}])" + pattern(r.find) + "(?![\\\\p{L}\\\\p{N}])", "giu"), replace: r.replace }));

function spans(text) {
  const out = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text))) {
      const s = m.index, e = s + m[0].length;
      if (!out.some((o) => s < o.e && e > o.s)) out.push({ s, e, replace: rule.replace });
    }
  }
  return out.sort((a, b) => b.s - a.s);
}

(async () => {
  await figma.loadAllPagesAsync();
  let textEdits = 0, renamed = 0, hidden = 0, skipped = 0;
  for (const node of figma.root.findAll(() => true)) {
    const newName = node.name.replace ? spans(node.name).reduce((acc, sp) => acc.slice(0, sp.s) + sp.replace + acc.slice(sp.e), node.name) : node.name;
    if (newName !== node.name) { node.name = newName; renamed++; }
    if (node.type === "TEXT") {
      const hits = spans(node.characters);
      if (!hits.length) continue;
      try {
        await Promise.all(node.getRangeAllFontNames(0, node.characters.length).map((f) => figma.loadFontAsync(f)));
        for (const h of hits) {
          node.insertCharacters(h.e, h.replace, "BEFORE");
          node.deleteCharacters(h.s, h.e);
          textEdits++;
        }
      } catch (e) { skipped++; }
    }
  }
  for (const id of PLAN.hideNodeIds) {
    const n = await figma.getNodeByIdAsync(id);
    if (n && "fills" in n) {
      n.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.92 } }];
      if ("children" in n) for (const c of [...n.children]) c.remove();
      hidden++;
    }
  }
  figma.closePlugin("Blueprint Cleaner: " + textEdits + " text replacements, " + renamed + " layers renamed, " + hidden + " logos blanked" + (skipped ? ", " + skipped + " text layers skipped (missing fonts)" : ""));
})();
`;
  const zip = new JSZip();
  zip.file("blueprint-cleaner/manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("blueprint-cleaner/code.js", code);
  zip.file(
    "blueprint-cleaner/README.txt",
    `Blueprint Cleaner for: ${sourceTitle}\n\n1. In Figma, duplicate the original file (File > Duplicate) and open the duplicate.\n2. Menu > Plugins > Development > Import plugin from manifest... and pick manifest.json from this folder.\n3. Run Plugins > Development > Blueprint Cleaner. It reports how many replacements it made.\n4. Paste the duplicate's link into Blueprint Studio and click "Verify cleaned file".\n\nRe-download this plugin after changing findings: the replacement list is baked into code.js.\n`,
  );
  return zip.generateAsync({ type: "uint8array" });
}
