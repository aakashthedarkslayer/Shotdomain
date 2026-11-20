import { readDb } from "@/lib/store";
import { aiConfigured } from "@/lib/clean/ai";
import { figmaConfigured } from "@/lib/clean/figma";
import { UploadForm } from "./UploadForm";

export default async function UploadPage(props: PageProps<"/upload">) {
  const sp = await props.searchParams;
  const db = await readDb();
  const projects = db.projects.map((p) => ({ id: p.id, name: p.name })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Upload</h1>
        <p className="text-sm text-slate-500">
          Add proposals and case studies (PDF or Word .docx) or Figma links. Each one is scanned and cleaned automatically, then waits in the review queue for your approval.
        </p>
      </header>
      <UploadForm projects={projects} defaultProjectId={typeof sp.project === "string" ? sp.project : ""} />
      <div className="card space-y-2 p-4 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800">What gets removed</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Every dictionary term for the chosen project, plus global agency branding (all spellings, e.g. “Baby Latch”, “BabyLatch”, “babylatch”).</li>
          <li>Emails, phone numbers, websites and app-store links, company/tax numbers, and names after labels such as “Prepared by”.</li>
          <li>Document properties (author, company, title), hyperlinks to removed sites, and logos in headers and footers.</li>
          <li>{aiConfigured() ? "AI detection is on: Claude also looks for client names, people, brands and addresses the dictionary doesn't know yet." : "AI detection is off. Set ANTHROPIC_API_KEY to also catch names the dictionary doesn't know yet."}</li>
          {!figmaConfigured() && <li>Figma scanning needs FIGMA_TOKEN in the server's environment.</li>}
        </ul>
      </div>
    </div>
  );
}
