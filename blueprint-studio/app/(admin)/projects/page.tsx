import Link from "next/link";
import { createProject } from "@/app/actions";
import { readDb } from "@/lib/store";
import { ImportCatalog } from "./ImportCatalog";

export default async function ProjectsPage(props: PageProps<"/projects">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const db = await readDb();
  const rows = db.projects
    .filter((p) => !q || `${p.name} ${p.industry || ""} ${p.country || ""}`.toLowerCase().includes(q))
    .map((p) => {
      const srcs = db.sources.filter((s) => s.projectId === p.id);
      return { p, srcs, terms: db.terms.filter((t) => t.projectId === p.id).length };
    })
    .sort((a, b) => b.srcs.length - a.srcs.length || a.p.name.localeCompare(b.p.name));

  return (
    <div className="max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-slate-500">One project per real client product. Linking uploads to a project applies its dictionary and shows when its blueprint (proposal + case study + Figma) is fully approved.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <form action={createProject} className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold">New project</h2>
          <input name="name" required className="input" placeholder="Project name, e.g. Baby Latch" />
          <div className="grid grid-cols-2 gap-2">
            <input name="industry" className="input" placeholder="Industry" />
            <input name="country" className="input" placeholder="Country" />
          </div>
          <textarea name="aliases" rows={2} className="input" placeholder="Client names to remove, comma separated (e.g. Orbital Evolution, Grant Seed)" />
          <button className="btn btn-primary">Create project</button>
        </form>
        <ImportCatalog />
      </div>

      <form>
        <input name="q" defaultValue={q} placeholder={`Search ${db.projects.length} projects…`} className="input max-w-sm" />
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Project</th>
              <th className="th">Industry</th>
              <th className="th">Dictionary</th>
              <th className="th">Sources</th>
              <th className="th">Approved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(0, 400).map(({ p, srcs, terms }) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="td"><Link href={`/projects/${p.id}`} className="font-medium hover:text-brand-600">{p.name}</Link>{p.country && <span className="ml-2 text-xs text-slate-400">{p.country}</span>}</td>
                <td className="td text-slate-600">{p.industry}</td>
                <td className="td text-slate-600">{terms} terms</td>
                <td className="td text-slate-600">{srcs.length || "–"}</td>
                <td className="td text-slate-600">{srcs.length ? `${srcs.filter((s) => s.status === "approved").length} / ${srcs.length}` : "–"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No projects yet. Create one or import the catalog.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
