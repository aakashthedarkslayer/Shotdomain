import Link from "next/link";
import { KindBadge, StatusBadge, timeAgo } from "@/components/Badges";
import { readDb } from "@/lib/store";
import type { SourceKind } from "@/lib/types";
import { KIND_LABEL } from "@/lib/types";

export default async function Dashboard() {
  const db = await readDb();
  const count = (f: (s: (typeof db.sources)[number]) => boolean) => db.sources.filter(f).length;
  const kinds: SourceKind[] = ["proposal", "case_study", "figma"];
  const queue = db.sources.filter((s) => s.status === "needs_review" || s.status === "changes_requested" || s.status === "error").slice(0, 8);
  // Projects whose every linked source is approved, with at least two kinds: blueprint candidates.
  const ready = db.projects
    .map((p) => {
      const srcs = db.sources.filter((s) => s.projectId === p.id);
      const approvedKinds = new Set(srcs.filter((s) => s.status === "approved").map((s) => s.kind));
      return { p, srcs, approvedKinds, allApproved: srcs.length > 0 && srcs.every((s) => s.status === "approved") };
    })
    .filter((x) => x.srcs.length)
    .sort((a, b) => b.approvedKinds.size - a.approvedKinds.size)
    .slice(0, 8);

  return (
    <div className="max-w-6xl space-y-7">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Upload source material, review the cleaned copies, approve what is safe to sell.</p>
        </div>
        <Link href="/upload" className="btn btn-primary">Upload files</Link>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Needs review" value={count((s) => s.status === "needs_review")} tone="amber" href="/sources?status=needs_review" />
        <Stat label="Changes requested" value={count((s) => s.status === "changes_requested")} tone="rose" href="/sources?status=changes_requested" />
        <Stat label="Approved" value={count((s) => s.status === "approved")} tone="emerald" href="/sources?status=approved" />
        <Stat label="Processing / errors" value={count((s) => s.status === "processing" || s.status === "error")} tone="sky" href="/sources?status=error" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {kinds.map((k) => {
          const all = db.sources.filter((s) => s.kind === k);
          const ok = all.filter((s) => s.status === "approved").length;
          return (
            <Link key={k} href={`/sources?kind=${k}`} className="card p-4 hover:border-brand-500">
              <div className="flex items-center justify-between">
                <KindBadge kind={k} />
                <span className="text-xs text-slate-500">{all.length} uploaded</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${all.length ? (ok / all.length) * 100 : 0}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{ok} of {all.length} {KIND_LABEL[k].toLowerCase()}s approved</p>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Waiting for you</h2>
          {queue.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing to review. <Link href="/upload" className="text-brand-600 hover:underline">Upload something</Link>.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {queue.map((s) => (
                <li key={s.id}>
                  <Link href={`/sources/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <KindBadge kind={s.kind} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.title || s.figmaUrl}</span>
                    {s.residual.length > 0 && <span className="text-xs text-rose-600">{s.residual.length} leftover{s.residual.length > 1 ? "s" : ""}</span>}
                    <StatusBadge status={s.status} />
                    <span className="w-20 text-right text-xs text-slate-400">{timeAgo(s.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card lg:col-span-2">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Blueprint readiness</h2>
          {ready.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Link uploads to projects to track which blueprints are complete.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {ready.map(({ p, approvedKinds, allApproved }) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {kinds.map((k) => (
                      <span key={k} title={KIND_LABEL[k]} className={`h-2.5 w-2.5 rounded-full ${approvedKinds.has(k) ? "bg-emerald-500" : "bg-slate-200"}`} />
                    ))}
                    {allApproved && approvedKinds.size === 3 && <span className="text-xs font-medium text-emerald-700">Complete</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">Dots: proposal · case study · Figma approved</p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, href }: { label: string; value: number; tone: "amber" | "rose" | "emerald" | "sky"; href: string }) {
  const color = { amber: "text-amber-600", rose: "text-rose-600", emerald: "text-emerald-600", sky: "text-sky-600" }[tone];
  return (
    <Link href={href} className="card p-4 hover:border-brand-500">
      <div className={`text-3xl font-semibold ${color}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </Link>
  );
}
