import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProject, deleteTerm, saveTerm } from "@/app/actions";
import { KindBadge, StatusBadge, timeAgo } from "@/components/Badges";
import { readDb } from "@/lib/store";
import { KIND_LABEL, TYPE_LABEL, type SourceKind, type TermType } from "@/lib/types";

export default async function ProjectPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  const db = await readDb();
  const p = db.projects.find((x) => x.id === id);
  if (!p) notFound();
  const sources = db.sources.filter((s) => s.projectId === id);
  const terms = db.terms.filter((t) => t.projectId === id);
  const kinds: SourceKind[] = ["proposal", "case_study", "figma"];

  return (
    <div className="max-w-5xl space-y-6">
      <nav className="text-sm text-slate-500"><Link href="/projects" className="hover:text-slate-800">Projects</Link> / <span className="text-slate-800">{p.name}</span></nav>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <p className="text-sm text-slate-500">{[p.industry, p.country, p.catalogId && `Catalog ${p.catalogId}`].filter(Boolean).join(" · ")}</p>
        </div>
        <Link href={`/upload?project=${id}`} className="btn btn-primary">Upload for this project</Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {kinds.map((k) => {
          const list = sources.filter((s) => s.kind === k);
          const approved = list.filter((s) => s.status === "approved").length;
          return (
            <div key={k} className={`card p-4 ${list.length && approved === list.length ? "border-emerald-300" : ""}`}>
              <KindBadge kind={k} />
              <p className="mt-2 text-sm text-slate-600">{list.length ? `${approved} of ${list.length} approved` : `No ${KIND_LABEL[k].toLowerCase()} yet`}</p>
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Sources</h2>
        <ul className="divide-y divide-slate-100">
          {sources.map((s) => (
            <li key={s.id}>
              <Link href={`/sources/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50">
                <KindBadge kind={s.kind} />
                <span className="min-w-0 flex-1 truncate">{s.title || s.figmaUrl}</span>
                <StatusBadge status={s.status} />
                <span className="w-20 text-right text-xs text-slate-400">{timeAgo(s.updatedAt)}</span>
              </Link>
            </li>
          ))}
          {sources.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">Nothing uploaded for this project yet.</li>}
        </ul>
      </section>

      <section className="card">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Project dictionary <span className="font-normal text-slate-500">(removed from every source of this project)</span></h2>
        <form action={saveTerm} className="grid gap-2 border-b border-slate-100 p-3 sm:grid-cols-[1.4fr_1fr_1.2fr_auto]">
          <input type="hidden" name="projectId" value={id} />
          <input name="text" required minLength={2} className="input" placeholder="Client, person, brand, domain…" />
          <select name="type" className="input" defaultValue="client">
            {(Object.keys(TYPE_LABEL) as TermType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
          <input name="replacement" className="input" placeholder="Replacement (optional)" />
          <button className="btn">Add</button>
        </form>
        <ul className="divide-y divide-slate-100 text-sm">
          <li className="flex items-center gap-3 px-4 py-2 text-slate-500"><span className="flex-1">{p.name}</span><span>Project name (always removed) → the Platform</span></li>
          {terms.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-2">
              <span className={`flex-1 font-medium ${t.enabled ? "" : "text-slate-400 line-through"}`}>{t.text}</span>
              <span className="text-slate-500">{TYPE_LABEL[t.type]} → {t.replacement}</span>
              <form action={deleteTerm.bind(null, t.id)}><button className="text-xs text-rose-600 hover:underline">Delete</button></form>
            </li>
          ))}
        </ul>
      </section>

      <form action={deleteProject.bind(null, id)}>
        <button className="btn btn-danger">Delete project</button>
        <span className="ml-3 text-xs text-slate-500">Sources stay, but are unlinked.</span>
      </form>
    </div>
  );
}
