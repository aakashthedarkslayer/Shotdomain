import Link from "next/link";
import { deleteTerm, saveTerm, toggleTerm } from "@/app/actions";
import { readDb } from "@/lib/store";
import { TYPE_LABEL, type TermType } from "@/lib/types";

export default async function TermsPage(props: PageProps<"/terms">) {
  const sp = await props.searchParams;
  const scope = typeof sp.scope === "string" ? sp.scope : "global";
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const db = await readDb();
  const projectName = new Map(db.projects.map((p) => [p.id, p.name]));
  const terms = db.terms
    .filter((t) => (scope === "all" ? true : scope === "global" ? t.scope === "global" : t.scope === "project"))
    .filter((t) => !q || t.text.toLowerCase().includes(q) || (projectName.get(t.projectId || "") || "").toLowerCase().includes(q))
    .sort((a, b) => (projectName.get(a.projectId || "") || "").localeCompare(projectName.get(b.projectId || "") || "") || a.text.localeCompare(b.text));

  return (
    <div className="max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Dictionary</h1>
        <p className="text-sm text-slate-500">
          Words that must never appear in a cleaned copy. <b>Global</b> terms (your agency name, domains) apply to every upload; <b>project</b> terms apply to sources linked to that project. Matching ignores case and spacing, so “Baby Latch” also removes “BabyLatch”.
        </p>
      </header>

      <form action={saveTerm} className="card grid gap-3 p-4 sm:grid-cols-[1.3fr_1fr_1.2fr_1.2fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="text">Term</label>
          <input id="text" name="text" required minLength={2} className="input" placeholder="e.g. Acme Health" />
        </div>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select id="type" name="type" className="input" defaultValue="client">
            {(Object.keys(TYPE_LABEL) as TermType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="replacement">Replace with</label>
          <input id="replacement" name="replacement" className="input" placeholder="Default for the type" />
        </div>
        <div>
          <label className="label" htmlFor="projectId">Applies to</label>
          <select id="projectId" name="projectId" className="input" defaultValue="">
            <option value="">All uploads (global)</option>
            {[...db.projects].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary">Add term</button>
      </form>

      <form className="flex flex-wrap items-center gap-2">
        {[["global", "Global"], ["project", "Project terms"], ["all", "All"]].map(([v, l]) => (
          <Link key={v} href={`/terms?scope=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`rounded-full px-3 py-1 text-sm ${scope === v ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{l}</Link>
        ))}
        <input type="hidden" name="scope" value={scope} />
        <input name="q" defaultValue={q} placeholder="Search terms or projects…" className="input ml-auto w-64" />
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Term</th>
              <th className="th">Type</th>
              <th className="th">Replace with</th>
              <th className="th">Applies to</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {terms.slice(0, 500).map((t) => (
              <tr key={t.id} className={t.enabled ? "" : "text-slate-400"}>
                <td className={`td font-medium ${t.enabled ? "" : "line-through"}`}>{t.text}</td>
                <td className="td text-slate-600">{TYPE_LABEL[t.type]}</td>
                <td className="td text-slate-600">{t.replacement}</td>
                <td className="td text-slate-600">{t.projectId ? <Link className="hover:underline" href={`/projects/${t.projectId}`}>{projectName.get(t.projectId) || "Deleted project"}</Link> : "Global"}</td>
                <td className="td text-right">
                  <div className="flex justify-end gap-3 text-xs">
                    <form action={toggleTerm.bind(null, t.id)}><button className="text-slate-600 hover:underline">{t.enabled ? "Disable" : "Enable"}</button></form>
                    <form action={deleteTerm.bind(null, t.id)}><button className="text-rose-600 hover:underline">Delete</button></form>
                  </div>
                </td>
              </tr>
            ))}
            {terms.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No terms here yet.</td></tr>
            )}
          </tbody>
        </table>
        {terms.length > 500 && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Showing 500 of {terms.length}. Search to narrow down.</p>}
      </div>
      <p className="text-xs text-slate-500">Changes apply to new uploads and to the next “Re-scan” of existing ones.</p>
    </div>
  );
}
