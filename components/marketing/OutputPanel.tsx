import { DEVICE_PRESETS } from '@/lib/devices';

/*
 * The hero's picture: what a capture actually gives you. File names follow
 * lib/dedupe.ts urlToFilename ("/" -> home.png, "/blog/launch-notes" ->
 * blog-launch-notes.png) and the folders follow lib/screenshot.ts, so this is
 * the real layout of the ZIP, for an example site. DESIGN.md code-editor-mockup.
 */

const PAGES = ['home', 'pricing', 'about', 'blog', 'blog-launch-notes', 'contact', 'careers'];
const MORE = 35;

/** `collapse`: on phones, one line instead of the same file list again. */
function Folder({ name, size, collapse = false }: { name: string; size: string; collapse?: boolean }) {
  return (
    <div>
      <p className="flex items-baseline justify-between gap-4 text-fg">
        <span>{name}/</span>
        <span className="text-faint">{size}</span>
      </p>
      {collapse && <p className="mt-2 border-l border-line pl-4 text-muted sm:hidden">the same {PAGES.length + MORE} file names</p>}
      <ul className={`mt-2 space-y-1 border-l border-line pl-4 text-muted ${collapse ? 'hidden sm:block' : ''}`}>
        {PAGES.map((p) => (
          <li key={p} className="truncate">
            {p}.png
          </li>
        ))}
        <li className="text-faint">+ {MORE} more</li>
      </ul>
    </div>
  );
}

export function OutputPanel() {
  const desktop = 1920;
  const phone = DEVICE_PRESETS['Mobile (iOS)'];
  const total = (PAGES.length + MORE) * 2;
  return (
    <figure className="text-left">
      <div className="band-dark overflow-hidden rounded-lg border border-line font-mono text-[13px] leading-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <span className="text-fg">example.com-2026-11-24.zip</span>
          <span className="text-faint">
            {PAGES.length + MORE} pages × 2 devices = {total} screenshots
          </span>
        </div>
        <div className="grid gap-8 px-5 py-5 sm:grid-cols-2">
          <Folder name="desktop" size={`${desktop} px wide`} />
          <Folder name="mobile-ios" size={`${phone.width} px @${phone.deviceScaleFactor}x`} collapse />
        </div>
      </div>
      <figcaption className="mt-3 text-sm leading-6 text-muted">
        What you download: a folder per device, a full-page PNG per page, named after the page.
      </figcaption>
    </figure>
  );
}
