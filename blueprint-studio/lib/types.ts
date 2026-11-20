export type SourceKind = "proposal" | "case_study" | "figma" | "other";

export type SourceStatus =
  | "processing"
  | "needs_review"
  | "changes_requested"
  | "approved"
  | "error";

export type TermType =
  | "client"
  | "product"
  | "person"
  | "agency"
  | "email"
  | "phone"
  | "url"
  | "address"
  | "id_number"
  | "other";

export type FindingOrigin = "project" | "global" | "pattern" | "ai" | "manual";

/** A dictionary entry: something that identifies a client (or the agency). */
export interface Term {
  id: string;
  text: string;
  type: TermType;
  replacement: string;
  scope: "global" | "project";
  projectId?: string;
  enabled: boolean;
  createdAt: string;
}

/** One thing found in a source that should (or might) be replaced. */
export interface Finding {
  id: string;
  /** Canonical text, used as the key when decisions carry over between scans. */
  text: string;
  /** Every spelling actually present in the document (case/spacing variants). */
  variants: string[];
  type: TermType;
  replacement: string;
  origin: FindingOrigin;
  count: number;
  enabled: boolean;
  reason?: string;
}

/** An embedded image (logo, screenshot) the reviewer can choose to blank out. */
export interface ImageItem {
  id: string;
  /** "area" = a box the reviewer drew on a page preview; everything under it is removed. */
  kind?: "image" | "area";
  page?: number;
  bbox?: [number, number, number, number];
  /** For DOCX: path of the media part inside the package. */
  part?: string;
  width: number;
  height: number;
  /** Preview file name under the source's preview folder. */
  preview?: string;
  suggested: boolean;
  reason?: string;
  redact: boolean;
}

export interface ResidualHit {
  text: string;
  count: number;
  context: string;
}

export interface ReviewEvent {
  at: string;
  action: "uploaded" | "cleaned" | "approved" | "changes_requested" | "reopened" | "note" | "error";
  note?: string;
}

export interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  projectId?: string;
  status: SourceStatus;
  /** "pdf" | "docx" | "figma" */
  format: "pdf" | "docx" | "figma";
  fileName?: string;
  figmaUrl?: string;
  /** Editable duplicate the reviewer cleaned with the plugin, used for verification. */
  cleanedFigmaUrl?: string;
  pages?: number;
  findings: Finding[];
  images: ImageItem[];
  residual: ResidualHit[];
  residualCheckedAt?: string;
  aiUsed: boolean;
  aiError?: string;
  error?: string;
  history: ReviewEvent[];
  createdAt: string;
  updatedAt: string;
  cleanedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  industry?: string;
  country?: string;
  catalogId?: string;
  createdAt: string;
}

export interface Db {
  projects: Project[];
  sources: Source[];
  terms: Term[];
}

export const KIND_LABEL: Record<SourceKind, string> = {
  proposal: "Proposal",
  case_study: "Case study",
  figma: "Figma design",
  other: "Other document",
};

export const STATUS_LABEL: Record<SourceStatus, string> = {
  processing: "Processing",
  needs_review: "Needs review",
  changes_requested: "Changes requested",
  approved: "Approved",
  error: "Error",
};

export const TYPE_LABEL: Record<TermType, string> = {
  client: "Client / company",
  product: "Product / brand",
  person: "Person",
  agency: "Agency branding",
  email: "Email",
  phone: "Phone",
  url: "Website / URL",
  address: "Address",
  id_number: "Company / tax ID",
  other: "Other",
};

export const DEFAULT_REPLACEMENT: Record<TermType, string> = {
  client: "the Client",
  product: "the Platform",
  person: "[Name]",
  agency: "the Development Team",
  email: "contact@example.com",
  phone: "+00 000 000 000",
  url: "example.com",
  address: "[Address]",
  id_number: "[Company ID]",
  other: "[Redacted]",
};
