"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { addManualFinding, saveReview, type FindingEdit } from "@/app/actions";
import type { Finding, ImageItem, Source, TermType } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/types";

/** Page previews are rendered at this scale (see renderPdfPages). */
const PREVIEW_SCALE = 0.8;

const ORIGIN_LABEL: Record<Finding["origin"], { label: string; cls: string }> = {
  manual: { label: "You", cls: "bg-slate-800 text-white" },
  project: { label: "Project", cls: "bg-violet-100 text-violet-800" },
  global: { label: "Global", cls: "bg-slate-200 text-slate-700" },
  pattern: { label: "Pattern", cls: "bg-sky-100 text-sky-800" },
  ai: { label: "AI", cls: "bg-indigo-100 text-indigo-800" },
};

type Area = { page: number; bbox: [number, number, number, number] };

export function ReviewWorkspace({ source, origPreviews, cleanPreviews }: { source: Source; origPreviews: string[]; cleanPreviews: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edits, setEdits] = useState<Record<string, FindingEdit>>({});
  const [imageRedact, setImageRedact] = useState<Record<string, boolean>>({});
  const [newAreas, setNewAreas] = useState<Area[]>([]);
  const [removedAreas, setRemovedAreas] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const current = (f: Finding): FindingEdit => edits[f.id] ?? { id: f.id, enabled: f.enabled, replacement: f.replacement, type: f.type };
  const patch = (f: Finding, p: Partial<FindingEdit>) => setEdits((e) => ({ ...e, [f.id]: { ...current(f), ...p } }));
  const redacted = (im: ImageItem) => imageRedact[im.id] ?? im.redact;
  const dirty = Object.keys(edits).length > 0 || Object.keys(imageRedact).length > 0 || newAreas.length > 0 || removedAreas.length > 0;

  const shown = useMemo(() => {
    const q = filter.toLowerCase();
    return source.findings.filter((f) => !q || f.text.toLowerCase().includes(q) || f.replacement.toLowerCase().includes(q) || f.type.includes(q));
  }, [filter, source.findings]);

  function save() {
    setSaveError(null);
    start(async () => {
      try {
        await saveReview(source.id, Object.values(edits), imageRedact, newAreas.map((a) => ({ id: "", kind: "area", page: a.page, bbox: a.bbox, width: 0, height: 0, suggested: false, redact: true })), removedAreas);
        setEdits({});
        setImageRedact({});
        setNewAreas([]);
        setRemovedAreas([]);
        router.refresh();
      } catch (e) {
        setSaveError((e as Error).message);
      }
    });
  }

  const realImages = source.images.filter((i) => i.kind !== "area");
  const areas = source.images.filter((i) => i.kind === "area" && !removedAreas.includes(i.id));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_560px]">
      <Previews
        source={source}
        orig={origPreviews}
        clean={cleanPreviews}
        areas={areas}
        newAreas={newAreas}
        images={realImages.filter((i) => redacted(i))}
        onAddArea={(a) => setNewAreas((x) => [...x, a])}
        onRemoveArea={(id) => setRemovedAreas((x) => [...x, id])}
        onRemoveNewArea={(i) => setNewAreas((x) => x.filter((_, k) => k !== i))}
      />

      <div className="space-y-5">
        <div className={`sticky top-4 z-20 flex items-center gap-3 rounded-xl border p-3 shadow-sm backdrop-blur ${dirty ? "border-brand-500 bg-brand-50/95" : "border-slate-200 bg-white/95"}`}>
          <button onClick={save} disabled={!dirty || pending} className="btn btn-primary">
            {pending ? "Re-cleaning…" : "Save & re-clean"}
          </button>
          <span className="text-sm text-slate-500">{saveError ? <span className="text-rose-600">{saveError}</span> : dirty ? "Unsaved changes" : "Cleaned copy is up to date"}</span>
          {dirty && !pending && (
            <button
              className="ml-auto text-sm text-slate-500 hover:underline"
              onClick={() => {
                setEdits({});
                setImageRedact({});
                setNewAreas([]);
                setRemovedAreas([]);
              }}
            >
              Discard
            </button>
          )}
        </div>
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold">
              Findings <span className="font-normal text-slate-500">({source.findings.filter((f) => current(f).enabled).length} of {source.findings.length} will be replaced)</span>
            </h2>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" className="input w-36 py-1" />
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="th w-8" />
                  <th className="th">Found</th>
                  <th className="th">Replace with</th>
                  <th className="th w-12 text-right">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((f) => {
                  const c = current(f);
                  const o = ORIGIN_LABEL[f.origin];
                  return (
                    <tr key={f.id} className={c.enabled ? "" : "bg-slate-50 text-slate-400"}>
                      <td className="td">
                        <input type="checkbox" checked={c.enabled} onChange={(e) => patch(f, { enabled: e.target.checked })} aria-label={`Replace ${f.text}`} />
                      </td>
                      <td className="td">
                        <div className={`break-all font-medium ${c.enabled ? "text-slate-900" : "line-through"}`}>{f.text}</div>
                        {f.variants.filter((v) => v !== f.text).length > 0 && <div className="text-xs text-slate-500">also: {f.variants.filter((v) => v !== f.text).join(", ")}</div>}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${o.cls}`}>{o.label}</span>
                          <select value={c.type} onChange={(e) => patch(f, { type: e.target.value as TermType })} className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-600">
                            {(Object.keys(TYPE_LABEL) as TermType[]).map((t) => (
                              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                            ))}
                          </select>
                          {f.reason && <span className="text-xs text-slate-400" title={f.reason}>{f.reason.length > 34 ? f.reason.slice(0, 32) + "…" : f.reason}</span>}
                        </div>
                      </td>
                      <td className="td">
                        <input value={c.replacement} onChange={(e) => patch(f, { replacement: e.target.value })} className="input py-1" disabled={!c.enabled} />
                        {(f.origin === "ai" || f.origin === "pattern" || f.origin === "manual") && c.enabled && (
                          <select value={c.remember || ""} onChange={(e) => patch(f, { remember: (e.target.value || undefined) as FindingEdit["remember"] })} className="mt-1 rounded border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-600">
                            <option value="">Only this file</option>
                            {source.projectId && <option value="project">Remember for this project</option>}
                            <option value="global">Remember everywhere</option>
                          </select>
                        )}
                      </td>
                      <td className="td text-right text-slate-500">{f.count}</td>
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">No findings{filter ? " match" : ""}.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <form action={addManualFinding.bind(null, source.id)} className="grid grid-cols-[1fr_1fr] gap-2 border-t border-slate-100 p-3 sm:grid-cols-[1.2fr_0.9fr_1fr_auto]">
            <input name="text" required minLength={2} placeholder="Missed something? e.g. Sarah Jones" className="input" />
            <select name="type" className="input" defaultValue="person">
              {(Object.keys(TYPE_LABEL) as TermType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
            <input name="replacement" placeholder="Replacement (optional)" className="input" />
            <select name="remember" className="input col-span-1 sm:col-span-2" defaultValue={source.projectId ? "project" : ""}>
              <option value="">Only this file</option>
              {source.projectId && <option value="project">Also add to project dictionary</option>}
              <option value="global">Also add to global dictionary</option>
            </select>
            <button className="btn col-span-1 sm:col-span-2">Add &amp; re-clean</button>
          </form>
        </section>

        {realImages.length > 0 && (
          <section className="card">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
              Images <span className="font-normal text-slate-500">({realImages.filter(redacted).length} will be blanked)</span>
            </h2>
            <div className="grid max-h-[420px] grid-cols-3 gap-3 overflow-auto p-3">
              {realImages.map((im) => (
                <label key={im.id} className={`cursor-pointer rounded-lg border p-2 text-xs ${redacted(im) ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="grid h-20 place-items-center overflow-hidden rounded bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:12px_12px]">
                    {im.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/files/${source.id}/preview/${im.preview}`} alt="" className="max-h-20 max-w-full object-contain" />
                    ) : (
                      <span className="text-slate-400">{source.format === "figma" ? "Layer" : "No preview"}</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-start gap-1.5">
                    <input type="checkbox" checked={redacted(im)} onChange={(e) => setImageRedact((x) => ({ ...x, [im.id]: e.target.checked }))} />
                    <span className="min-w-0">
                      <span className="block truncate text-slate-700">{im.page !== undefined ? `Page ${im.page + 1}` : im.part?.replace("word/media/", "")}</span>
                      {im.width > 0 && <span className="text-slate-400">{im.width}×{im.height}</span>}
                      {im.reason && <span className="block text-amber-700">{im.reason}</span>}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function Previews(props: {
  source: Source;
  orig: string[];
  clean: string[];
  areas: ImageItem[];
  newAreas: Area[];
  images: ImageItem[];
  onAddArea: (a: Area) => void;
  onRemoveArea: (id: string) => void;
  onRemoveNewArea: (i: number) => void;
}) {
  const { source, orig, clean } = props;
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<"side" | "original" | "cleaned" | "text">("side");
  const [draw, setDraw] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const pages = Math.max(orig.length, clean.length);
  const canDraw = source.format === "pdf";
  const v = encodeURIComponent(source.cleanedAt || "");

  if (!pages && source.format !== "figma") {
    return (
      <section className="card grid place-items-center p-10 text-sm text-slate-500">
        No page previews for this file. Download the cleaned copy to check it, or use the text view.
        <TextView sourceId={source.id} />
      </section>
    );
  }

  return (
    <section className="card min-w-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
          {(["side", "original", "cleaned", "text"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                if (m === "text" && text === null) fetch(`/api/files/${source.id}/text/cleaned`).then((r) => (r.ok ? r.text() : "Not available yet")).then(setText);
              }}
              className={`rounded-md px-2.5 py-1 font-medium capitalize ${mode === m ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {m === "side" ? "Side by side" : m === "text" ? "Cleaned text" : m}
            </button>
          ))}
        </div>
        {canDraw && mode !== "text" && (
          <button onClick={() => setDraw((d) => !d)} className={`btn py-1 text-xs ${draw ? "border-rose-400 bg-rose-50 text-rose-700" : ""}`} title="Drag on the original page to blank out an area (logos inside background images, signatures, screenshots)">
            {draw ? "Drawing: drag on original" : "Blank an area"}
          </button>
        )}
        {mode !== "text" && pages > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <button className="btn px-2 py-1" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
            <span className="tabular-nums text-slate-600">
              {source.format === "figma" ? "Frame" : "Page"} {page + 1} / {pages}
            </span>
            <button className="btn px-2 py-1" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>›</button>
          </div>
        )}
      </div>

      {mode === "text" ? (
        <pre className="max-h-[900px] overflow-auto whitespace-pre-wrap p-4 font-sans text-sm leading-relaxed text-slate-700">{text ?? "Loading…"}</pre>
      ) : (
        <div className={`grid gap-3 p-3 ${mode === "side" ? "grid-cols-2" : "grid-cols-1"}`}>
          {(mode === "side" || mode === "original") && (
            <figure>
              <figcaption className="mb-1 text-xs font-medium text-slate-500">Original{source.format === "docx" ? " (approximate layout; download to check headers, footers and images)" : ""}</figcaption>
              {orig[page] ? (
                <DrawablePage
                  src={`/api/files/${source.id}/preview/${orig[page]}`}
                  drawing={draw && canDraw}
                  boxes={[
                    ...props.areas.filter((a) => a.page === page).map((a) => ({ bbox: a.bbox!, kind: "area" as const, onRemove: () => props.onRemoveArea(a.id) })),
                    ...props.newAreas.map((a, i) => ({ a, i })).filter(({ a }) => a.page === page).map(({ a, i }) => ({ bbox: a.bbox, kind: "new" as const, onRemove: () => props.onRemoveNewArea(i) })),
                    ...props.images.filter((im) => im.page === page && im.bbox).map((im) => ({ bbox: im.bbox!, kind: "image" as const })),
                  ]}
                  onDraw={(bbox) => props.onAddArea({ page, bbox })}
                />
              ) : (
                <Empty />
              )}
            </figure>
          )}
          {(mode === "side" || mode === "cleaned") && (
            <figure>
              <figcaption className="mb-1 text-xs font-medium text-slate-500">Cleaned{source.format === "figma" && !source.cleanedFigmaUrl ? " (after you verify the duplicate)" : ""}</figcaption>
              {clean[page] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/files/${source.id}/preview/${clean[page]}?v=${v}`} alt={`Cleaned page ${page + 1}`} className="w-full rounded border border-slate-200" />
              ) : (
                <Empty />
              )}
            </figure>
          )}
        </div>
      )}
    </section>
  );
}

function Empty() {
  return <div className="grid aspect-[3/4] place-items-center rounded border border-dashed border-slate-200 text-sm text-slate-400">No preview</div>;
}

function TextView({ sourceId }: { sourceId: string }) {
  const [text, setText] = useState<string | null>(null);
  return text === null ? (
    <button className="btn mt-3" onClick={() => fetch(`/api/files/${sourceId}/text/cleaned`).then((r) => r.text()).then(setText)}>Show cleaned text</button>
  ) : (
    <pre className="mt-3 max-h-[600px] w-full overflow-auto whitespace-pre-wrap text-left font-sans text-sm text-slate-700">{text}</pre>
  );
}

type Box = { bbox: [number, number, number, number]; kind: "area" | "new" | "image"; onRemove?: () => void };

/** A page image you can drag rectangles on. Coordinates are converted to PDF points. */
function DrawablePage({ src, drawing, boxes, onDraw }: { src: string; drawing: boolean; boxes: Box[]; onDraw: (bbox: [number, number, number, number]) => void }) {
  const ref = useRef<HTMLImageElement>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [, setTick] = useState(0);

  // The image can finish loading before hydration (onLoad never fires), and boxes
  // must be re-laid-out when the column width changes.
  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete && img.naturalWidth) setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(img);
    return () => ro.disconnect();
  }, [src]);

  // display px -> PDF points: px * (naturalWidth / displayWidth) / PREVIEW_SCALE
  const factor = () => {
    const img = ref.current!;
    return img.naturalWidth / img.clientWidth / PREVIEW_SCALE;
  };
  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: Math.min(Math.max(e.clientX - r.left, 0), r.width), y: Math.min(Math.max(e.clientY - r.top, 0), r.height) };
  };

  return (
    <div className={`relative select-none ${drawing ? "cursor-crosshair" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt="Original page"
        draggable={false}
        onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        className="w-full rounded border border-slate-200"
        onPointerDown={(e) => {
          if (!drawing) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = pos(e);
          setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
        }}
        onPointerMove={(e) => {
          if (!drag) return;
          const p = pos(e);
          setDrag({ ...drag, x1: p.x, y1: p.y });
        }}
        onPointerUp={() => {
          if (!drag) return;
          const f = factor();
          const [x0, x1] = [Math.min(drag.x0, drag.x1), Math.max(drag.x0, drag.x1)];
          const [y0, y1] = [Math.min(drag.y0, drag.y1), Math.max(drag.y0, drag.y1)];
          setDrag(null);
          if (x1 - x0 < 4 || y1 - y0 < 4) return;
          onDraw([x0 * f, y0 * f, x1 * f, y1 * f].map((n) => Math.round(n * 10) / 10) as [number, number, number, number]);
        }}
      />
      {natural &&
        ref.current &&
        boxes.map((b, i) => {
          const f = factor();
          const [x0, y0, x1, y1] = b.bbox.map((n) => n / f);
          const color = b.kind === "image" ? "border-amber-500 bg-amber-400/20" : "border-rose-500 bg-rose-500/25";
          return (
            <div key={i} className={`absolute border-2 ${color}`} style={{ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }}>
              {b.onRemove && (
                <button onClick={b.onRemove} className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-xs text-white shadow" title="Remove this area">
                  ×
                </button>
              )}
            </div>
          );
        })}
      {drag && (
        <div
          className="pointer-events-none absolute border-2 border-dashed border-rose-600 bg-rose-500/20"
          style={{ left: Math.min(drag.x0, drag.x1), top: Math.min(drag.y0, drag.y1), width: Math.abs(drag.x1 - drag.x0), height: Math.abs(drag.y1 - drag.y0) }}
        />
      )}
    </div>
  );
}
