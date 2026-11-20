# Blueprint Studio: Admin

Private admin panel for preparing real project material (proposals, case studies, Figma designs) for commercial release. Upload a file, the app removes client and agency branding, and you review and approve the cleaned copy.

## Run it

```bash
cp .env.example .env.local   # set ADMIN_PASSWORD and SESSION_SECRET
npm install
npm run build && npm start   # http://localhost:3100
```

Uploads, cleaned files and the database (`db.json`) live in `./data` (or `DATA_DIR`). That folder is git-ignored: back it up, never commit it.

| Variable | Needed for |
|---|---|
| `ADMIN_PASSWORD`, `SESSION_SECRET` | Sign-in (required) |
| `ANTHROPIC_API_KEY` | Optional AI pass that finds client names, people and brands the dictionary doesn't know yet |
| `FIGMA_TOKEN` | Scanning Figma files (read access is enough) |

## Workflow

1. **Projects → Import portfolio catalog** with `portfolio_master.json`. Creates one project per real product and seeds its dictionary (client contacts, live-site domains, short brand names).
2. **Upload** PDFs / DOCX (or paste Figma links) and link them to a project.
3. Each upload is scanned automatically. Findings come from:
   - the **dictionary**: global terms (agency name and domains) plus the project's terms; matching ignores case and spacing ("Baby Latch" = "BabyLatch" = "babylatch") and swallows legal suffixes ("Acme Pty Ltd");
   - **patterns**: emails, phone numbers, URLs and domains, ABN/ACN/VAT numbers, names after "Prepared by", "Contact:" and similar;
   - **AI** (optional): Claude reads the text and lists anything else that identifies the client.
4. **Review** each source side by side, original and cleaned:
   - untick false positives, edit replacements, add missed terms ("remember for this project" adds them to the dictionary);
   - tick logos to blank, or **Blank an area** to drag a box over anything baked into an image (e.g. a logo inside a cover background);
   - **Save & re-clean** regenerates the copy, then re-reads it and lists any **possible leftovers**.
5. **Approve** (or request changes). A project is blueprint-complete when its proposal, case study and Figma are all approved.

## What cleaning does per format

- **PDF**: true redaction with MuPDF. Matched text is removed from the page content, not covered over. Replacement text is drawn in the original's size, colour and weight, and shrinks a little if it is longer than the original. Selected images and drawn areas are blanked pixel by pixel. Links to removed sites, document metadata and bookmarks are stripped. PDFs can't reflow, so short replacements look best.
- **DOCX**: run-aware text replacement across body, headers, footers, footnotes, comments and field codes, keeping formatting. Also clears hyperlink targets and document properties (author, company, title) and replaces chosen images with a neutral placeholder.
- **Figma**: the REST API is read-only, so the app scans the file (text layers and layer names) and builds a small **Blueprint Cleaner** dev plugin with the replacements baked in. Run it in an editable duplicate, then paste the duplicate's link back to verify.

## Limits to know

- The leftover check only knows the terms it was given. A client name that is in neither the dictionary nor found by the AI pass can't be detected, so skim every cleaned copy before approving.
- Text drawn as an image (screenshots, scanned pages) isn't searchable: use "Blank an area".
- `.doc`, `.pptx` and scanned PDFs are not supported yet.

## Engine test without the UI

```bash
npm run test:clean -- path/to/file.pdf "Project name" "Client Co,Jane Doe"
```
