import type { SourceKind, SourceStatus } from "@/lib/types";
import { KIND_LABEL, STATUS_LABEL } from "@/lib/types";

const STATUS_STYLE: Record<SourceStatus, string> = {
  processing: "bg-sky-50 text-sky-700 ring-sky-200",
  needs_review: "bg-amber-50 text-amber-800 ring-amber-200",
  changes_requested: "bg-rose-50 text-rose-700 ring-rose-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  error: "bg-rose-100 text-rose-800 ring-rose-300",
};

export function StatusBadge({ status }: { status: SourceStatus }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]}`}>{status === "processing" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />}{STATUS_LABEL[status]}</span>;
}

const KIND_STYLE: Record<SourceKind, string> = {
  proposal: "bg-violet-50 text-violet-700",
  case_study: "bg-teal-50 text-teal-700",
  figma: "bg-pink-50 text-pink-700",
  other: "bg-slate-100 text-slate-600",
};

export function KindBadge({ kind }: { kind: SourceKind }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${KIND_STYLE[kind]}`}>{KIND_LABEL[kind]}</span>;
}

export function timeAgo(iso?: string) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
