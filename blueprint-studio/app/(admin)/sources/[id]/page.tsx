import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSource, rescan, setDecision, updateSourceMeta, verifyFigmaAction } from "@/app/actions";
import { AutoRefresh } from "@/components/AutoRefresh";
import { KindBadge, StatusBadge, timeAgo } from "@/components/Badges";
import { listPreviews } from "@/lib/clean/pipeline";
import { readDb } from "@/lib/store";
import { KIND_LABEL, type SourceKind } from "@/lib/types";
import { ReviewWorkspace } from "./ReviewWorkspace";

export default async function SourcePage(props: PageProps<"/sources/[id]">) {
  const { id } = await props.params;
  const db = await readDb();
  const s = db.sources.find((x) => x.id === id);
  if (!s) notFound();
  const project = db.projects.find((p) => p.id === s.projectId);
  const [orig, clean] = await Promise.all([listPreviews(id, "orig"), listPreviews(id, "clean")]);
  const enabled = s.findings.filter((f) => f.enabled);
  const decide = setDecision.bind(null, id);
  const busy = s.status === "processing";

  return (
    <div className="max-w-[1500px] space-y-5">
      {busy && <AutoRefresh every={2500} />}
      <nav className="text-sm text-slate-500">
        <Link href="/sources" className="hover:text-slate-800">Review queue</Link> / <span className="text-slate-800">{s.title || "Figma file"}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{s.title || s.figmaUrl}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <StatusBadge status={s.status} />
            <KindBadge kind={s.kind} />
            <span>{s.format.toUpperCase()}{s.pages ? ` · ${s.pages} pages` : ""}</span>
            <span>·</span>
            {project ? <Link className="text-brand-600 hover:underline" href={`/projects/${project.id}`}>{project.name}</Link> : <span className="text-amber-700">No project linked</span>}
            <span>· cleaned {timeAgo(s.cleanedAt)}</span>
            {s.aiUsed && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">AI-checked</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.format !== "figma" && <a className="btn" href={`/api/files/${id}/original`}>Original</a>}
          {s.cleanedAt && (
            <a className="btn btn-primary" href={`/api/files/${id}/cleaned`}>
              {s.format === "figma" ? "Download cleaner plugin" : "Download cleaned"}
            </a>
          )}
          <form action={rescan.bind(null, id)}>
            <button className="btn" disabled={busy} title="Extract text again and re-run detection (keeps your decisions)">Re-scan</button>
          </form>
        </div>
      </header>

      {busy && <Banner tone="sky">Scanning and cleaning… this page refreshes on its own.</Banner>}
      {s.status === "error" && <Banner tone="rose">Cleaning failed: {s.error}</Banner>}
      {s.aiError && <Banner tone="amber">AI detection didn&apos;t run: {s.aiError}</Banner>}
      {s.format === "figma" && s.status !== "error" && !busy && (
        <div className="card space-y-3 p-4 text-sm">
          <h2 className="font-semibold">Clean this Figma file</h2>
          <ol className="list-decimal space-y-1 pl-5 text-slate-600">
            <li>Review the findings below and click <b>Save &amp; re-clean</b> if you change anything.</li>
            <li>In Figma, duplicate the file (the original stays untouched) and open the duplicate. You need edit access to it.</li>
            <li><a className="text-brand-600 hover:underline" href={`/api/files/${id}/cleaned`}>Download the cleaner plugin</a>, unzip it, then in Figma: Plugins → Development → Import plugin from manifest, and run <b>Blueprint Cleaner</b>.</li>
            <li>Paste the duplicate&apos;s link here to verify nothing identifying is left.</li>
          </ol>
          <form action={verifyFigmaAction.bind(null, id)} className="flex gap-2">
            <input name="cleanedUrl" className="input" placeholder="https://www.figma.com/design/… (cleaned duplicate)" defaultValue={s.cleanedFigmaUrl} />
            <button className="btn btn-primary">Verify cleaned file</button>
          </form>
          {s.figmaUrl && <p className="text-xs text-slate-500">Original: <a className="hover:underline" href={s.figmaUrl} target="_blank" rel="noreferrer">{s.figmaUrl}</a></p>}
        </div>
      )}

      {!busy && s.status !== "error" && (s.format !== "figma" || s.residualCheckedAt) && (
        s.residual.length ? (
          <div className="card border-rose-200 bg-rose-50/60 p-4">
            <h2 className="text-sm font-semibold text-rose-800">Possible leftovers in the cleaned copy ({s.residual.length})</h2>
            <p className="mb-2 text-xs text-rose-700">Found by re-reading the cleaned output. Usually text split across lines or drawn as an image: add an area box, or tick “I checked these” when approving.</p>
            <ul className="space-y-1 text-sm">
              {s.residual.map((r) => (
                <li key={r.text}><b className="text-rose-800">{r.text}</b> ×{r.count}: <span className="text-slate-600">…{r.context}…</span></li>
              ))}
            </ul>
          </div>
        ) : (
          <Banner tone="emerald">Re-read the cleaned copy: none of the {enabled.length} enabled findings, and no emails, phone numbers or links, remain. Names the scanner doesn&apos;t know about can&apos;t be checked{s.aiUsed ? "" : " (AI detection is off)"}: skim the cleaned copy before approving.</Banner>
        )
      )}

      {s.status !== "error" && s.findings.length + s.images.length > 0 && !busy && (
        <ReviewWorkspace source={s} origPreviews={orig} cleanPreviews={clean} />
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card space-y-3 p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Decision</h2>
          {s.status === "approved" ? (
            <form action={decide} className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-emerald-700">Approved: this cleaned copy is ready for final upload.</span>
              <input type="hidden" name="decision" value="reopen" />
              <button className="btn">Reopen</button>
            </form>
          ) : (
            <form action={decide} className="space-y-3">
              <textarea name="note" rows={2} className="input" placeholder="Note (optional, required context for “Request changes”)" />
              {s.residual.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-rose-700">
                  <input type="checkbox" name="override" /> I checked the possible leftovers and they are fine
                </label>
              )}
              <div className="flex flex-wrap gap-2">
                <button name="decision" value="approve" className="btn btn-success" disabled={busy || s.status === "error"}>Approve cleaned copy</button>
                <button name="decision" value="changes" className="btn">Request changes</button>
                <button name="decision" value="note" className="btn">Add note</button>
              </div>
            </form>
          )}
          <ol className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
            {[...s.history].reverse().map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-28 shrink-0 text-xs text-slate-400">{timeAgo(h.at)}</span>
                <span className="text-slate-600"><b className="font-medium capitalize text-slate-800">{h.action.replace("_", " ")}</b>{h.note ? `: ${h.note}` : ""}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold">Details</h2>
          <form action={updateSourceMeta.bind(null, id)} className="space-y-3">
            <div>
              <label className="label" htmlFor="title">Title</label>
              <input id="title" name="title" className="input" defaultValue={s.title} />
            </div>
            <div>
              <label className="label" htmlFor="kind">Type</label>
              <select id="kind" name="kind" className="input" defaultValue={s.kind}>
                {(Object.keys(KIND_LABEL) as SourceKind[]).map((k) => (
                  <option key={k} value={k}>{KIND_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="projectId">Project</label>
              <select id="projectId" name="projectId" className="input" defaultValue={s.projectId || ""}>
                <option value="">Not linked</option>
                {[...db.projects].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Changing the project re-scans with that project&apos;s dictionary.</p>
            </div>
            <button className="btn">Save details</button>
          </form>
          <form action={deleteSource.bind(null, id)} className="border-t border-slate-100 pt-3">
            <button className="btn btn-danger">Delete source and files</button>
          </form>
        </section>
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "sky" | "rose" | "amber" | "emerald"; children: React.ReactNode }) {
  const cls = { sky: "bg-sky-50 text-sky-800 border-sky-200", rose: "bg-rose-50 text-rose-800 border-rose-200", amber: "bg-amber-50 text-amber-800 border-amber-200", emerald: "bg-emerald-50 text-emerald-800 border-emerald-200" }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
