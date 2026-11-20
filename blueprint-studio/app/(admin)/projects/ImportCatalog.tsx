"use client";
import { useActionState } from "react";
import { importCatalog } from "@/app/actions";

export function ImportCatalog() {
  const [msg, action, pending] = useActionState(importCatalog, null);
  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="text-sm font-semibold">Import portfolio catalog</h2>
      <p className="text-xs text-slate-500">Upload <code>portfolio_master.json</code> (the master dataset). Creates a project per row and seeds its dictionary with client contacts and live-site domains. Safe to re-run.</p>
      <input type="file" name="catalog" accept=".json,application/json" className="block w-full text-sm" />
      <button className="btn" disabled={pending}>{pending ? "Importing…" : "Import"}</button>
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
    </form>
  );
}
