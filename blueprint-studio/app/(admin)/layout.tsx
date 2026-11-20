import Link from "next/link";
import { logout } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { aiConfigured } from "@/lib/clean/ai";
import { figmaConfigured } from "@/lib/clean/figma";
import { readDb } from "@/lib/store";
import { NavLink } from "@/components/NavLink";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const db = await readDb();
  const pending = db.sources.filter((s) => s.status === "needs_review" || s.status === "changes_requested").length;
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">B</span>
            <span>
              <span className="block text-sm font-semibold leading-tight">Blueprint Studio</span>
              <span className="block text-xs text-slate-500">Admin</span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 text-sm">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/upload">Upload</NavLink>
          <NavLink href="/sources" badge={pending || undefined}>
            Review queue
          </NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/terms">Dictionary</NavLink>
        </nav>
        <div className="space-y-1.5 border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
          <Status ok={aiConfigured()} label="AI detection" />
          <Status ok={figmaConfigured()} label="Figma access" />
          <form action={logout}>
            <button className="mt-2 text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-7">{children}</main>
    </div>
  );
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2" title={ok ? "Configured" : "Not configured: see .env.example"}>
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-slate-300"}`} />
      {label}
      {!ok && <span className="text-slate-400">(off)</span>}
    </div>
  );
}
