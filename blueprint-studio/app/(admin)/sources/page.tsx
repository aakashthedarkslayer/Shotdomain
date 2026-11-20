import Link from "next/link";
import { KindBadge, StatusBadge, timeAgo } from "@/components/Badges";
import { AutoRefresh } from "@/components/AutoRefresh";
import { readDb } from "@/lib/store";
import { KIND_LABEL, STATUS_LABEL, type SourceKind, type SourceStatus } from "@/lib/types";

export default async function SourcesPage(props: PageProps<"/sources">) {
  const sp = await props.searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const status = one("status");
  const kind = one("kind");
  const project = one("project");
  const q = one("q").toLowerCase();
  const db = await readDb();
  const projectName = new Map(db.projects.map((p) => [p.id, p.name]));
  const rows = db.sources.filter(
    (s) =>
      (!status || s.status === status) &&
      (!kind || s.kind === kind) &&
      (!project || (project === "none" ? !s.projectId : s.projectId === project)) &&
      (!q || `${s.title} ${s.fileName || ""} ${s.figmaUrl || ""} ${projectName.get(s.projectId || "") || ""}`.toLowerCase().includes(q)),
  );
  const processing = db.sources.some((s) => s.status === "processing");

  return (
    <div className="max-w-6xl space-y-5">
      {processing && <AutoRefresh every={3000} />}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Review queue</h1>
          <p className="text-sm text-slate-500">{rows.length} of {db.sources.length} sources</p>
        </div>
        <Link href="/upload" className="btn btn-primary">Upload files</Link>
      </header>

      <form className="card flex flex-wrap items-end gap-3 p-3">
        <div className="min-w-48 flex-1">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={one("q")} className="input" placeholder="Title, file name, project…" />
        </div>
        <Select name="status" value={status} label="Status" options={Object.entries(STATUS_LABEL) as Array<[SourceStatus, string]>} />
        <Select name="kind" value={kind} label="Type" options={Object.entries(KIND_LABEL) as Array<[SourceKind, string]>} />
        <Select name="project" value={project} label="Project" options={[["none", "Not linked"], ...db.projects.map((p) => [p.id, p.name] as [string, string]).sort((a, b) => a[1].localeCompare(b[1]))]} />
        <button className="btn">Filter</button>
        {(status || kind || project || q) && <Link href="/sources" className="btn">Clear</Link>}
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Source</th>
              <th className="th">Project</th>
              <th className="th">Findings</th>
              <th className="th">Check</th>
              <th className="th">Status</th>
              <th className="th text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((s) => {
              const enabled = s.findings.filter((f) => f.enabled);
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link href={`/sources/${s.id}`} className="font-medium text-slate-900 hover:text-brand-600">{s.title || s.figmaUrl}</Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <KindBadge kind={s.kind} />
                      {s.format.toUpperCase()}
                      {s.pages ? ` · ${s.pages} pages` : ""}
                    </div>
                  </td>
                  <td className="td text-slate-600">{s.projectId ? projectName.get(s.projectId) : <span className="text-slate-400">Not linked</span>}</td>
                  <td className="td text-slate-600">{s.status === "processing" ? "…" : `${enabled.length} to replace`}</td>
                  <td className="td">
                    {s.status === "processing" || s.status === "error" ? null : s.format === "figma" && !s.residualCheckedAt ? (
                      <span className="text-xs text-slate-500">Not verified</span>
                    ) : s.residual.length ? (
                      <span className="text-xs font-medium text-rose-600">{s.residual.length} possible leftover{s.residual.length > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600">Clean</span>
                    )}
                  </td>
                  <td className="td"><StatusBadge status={s.status} /></td>
                  <td className="td text-right text-xs text-slate-500">{timeAgo(s.updatedAt)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No sources match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Select({ name, value, label, options }: { name: string; value: string; label: string; options: Array<[string, string]> }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={value} className="input">
        <option value="">All</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}
