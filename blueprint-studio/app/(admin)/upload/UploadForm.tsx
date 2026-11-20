"use client";
import Link from "next/link";
import { useRef, useState } from "react";

type Result = { created: Array<{ id: string; title: string }>; rejected: Array<{ name: string; reason: string }> };

export function UploadForm({ projects, defaultProjectId }: { projects: Array<{ id: string; name: string }>; defaultProjectId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("proposal");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list).filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))]);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    fd.delete("files");
    for (const f of files) fd.append("files", f);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(res.status === 401 ? "Your session expired. Sign in again." : `Upload failed (${res.status})`);
      setResult(await res.json());
      setFiles([]);
      (e.target as HTMLFormElement).reset();
      setKind("proposal");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="kind">Type</label>
          <select id="kind" name="kind" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="proposal">Proposal</option>
            <option value="case_study">Case study</option>
            <option value="figma">Figma design (links)</option>
            <option value="other">Other document</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="projectId">Project</label>
          <select id="projectId" name="projectId" className="input" defaultValue={defaultProjectId}>
            <option value="">Not linked yet</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Linking a project applies its dictionary terms (client names, people, domains).</p>
        </div>
      </div>

      {kind === "figma" ? (
        <div>
          <label className="label" htmlFor="figmaUrls">Figma links (one per line)</label>
          <textarea id="figmaUrls" name="figmaUrls" rows={5} className="input font-mono text-xs" placeholder="https://www.figma.com/design/AbC123.../Project-name" />
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${drag ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-slate-400"}`}
        >
          <input ref={inputRef} type="file" name="files" multiple accept=".pdf,.docx" className="hidden" onChange={(e) => addFiles(e.target.files)} />
          <p className="text-sm font-medium text-slate-700">Drop PDF or DOCX files here, or click to choose</p>
          <p className="mt-1 text-xs text-slate-500">Up to 80 MB each. Old .doc files: save as .docx first.</p>
        </div>
      )}

      {files.length > 0 && kind !== "figma" && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
          {files.map((f) => (
            <li key={f.name + f.size} className="flex items-center justify-between px-3 py-2">
              <span className="truncate">{f.name}</span>
              <span className="flex items-center gap-3 text-xs text-slate-500">
                {(f.size / 1024 / 1024).toFixed(1)} MB
                <button type="button" className="text-rose-600 hover:underline" onClick={() => setFiles(files.filter((x) => x !== f))}>Remove</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy || (kind !== "figma" && files.length === 0)}>
          {busy ? "Uploading…" : kind === "figma" ? "Add Figma files" : `Upload ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
        </button>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      {result && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          {result.created.length > 0 && (
            <p>
              Added {result.created.length}. Cleaning runs in the background; they appear in the{" "}
              <Link href="/sources" className="font-medium text-brand-600 hover:underline">review queue</Link> as they finish.
            </p>
          )}
          <ul className="space-y-0.5">
            {result.created.map((c) => (
              <li key={c.id}>
                <Link href={`/sources/${c.id}`} className="text-brand-600 hover:underline">{c.title}</Link>
              </li>
            ))}
          </ul>
          {result.rejected.map((r) => (
            <p key={r.name} className="text-rose-600">
              Skipped {r.name}: {r.reason}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
