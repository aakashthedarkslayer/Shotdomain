/*
 * The hero's picture: a proof sheet. Six real frames from one ShotDomain
 * capture (ShotDomain run on its own site, on desktop, tablet and iPhone),
 * printed in the two inks by scripts/riso-print.mjs, set on a white sheet with
 * registration marks at its corners. The prints ink in once, in order, on load
 * (opacity only; instant with reduced motion). Real captures stay in full
 * colour everywhere else.
 */

interface Print {
  name: string;
  /** Pixel size of the WebP, for the aspect ratio. */
  w: number;
  h: number;
  /** Its path in the ZIP. */
  file: string;
  alt: string;
}

const DESKTOP = { w: 768, h: 480 };
const TABLET = { w: 360, h: 480 };
const PHONE = { w: 222, h: 480 };

const ROWS: Print[][] = [
  [
    { name: 'desktop-home', ...DESKTOP, file: 'desktop/home.png', alt: 'ShotDomain’s homepage on desktop' },
    { name: 'tablet-home', ...TABLET, file: 'tablet/home.png', alt: 'The homepage on iPad Pro 11' },
    { name: 'mobile-ios-home', ...PHONE, file: 'mobile-ios/home.png', alt: 'The homepage on iPhone 14 Pro' },
  ],
  [
    { name: 'mobile-ios-terms', ...PHONE, file: 'mobile-ios/terms.png', alt: 'The Terms of Service page on iPhone' },
    { name: 'desktop-privacy', ...DESKTOP, file: 'desktop/privacy.png', alt: 'The Privacy Policy page on desktop' },
    { name: 'tablet-privacy', ...TABLET, file: 'tablet/privacy.png', alt: 'The Privacy Policy page on iPad' },
  ],
];

/** A registration mark, printed in both inks: if they line up, the print is in register. */
function RegMark({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`absolute h-5 w-5 ${className}`}>
      <g fill="none" strokeWidth="1.2" className="stroke-print-pink">
        <circle cx="10.8" cy="10.6" r="5" />
        <path d="M10.8 1.6v18M1.8 10.6h18" />
      </g>
      <g fill="none" strokeWidth="1.2" className="stroke-primary">
        <circle cx="10" cy="10" r="5" />
        <path d="M10 1v18M1 10h18" />
      </g>
    </svg>
  );
}

export function ProofSheet() {
  return (
    <figure className="m-0">
      <div className="paper-sheet relative bg-surface-strong px-5 py-7 shadow-[var(--shadow-modal)] sm:px-9 sm:py-10">
        <RegMark className="top-2 left-2" />
        <RegMark className="top-2 right-2" />
        <RegMark className="bottom-2 left-2" />
        <RegMark className="right-2 bottom-2" />
        <ol className="space-y-5">
          {ROWS.map((row, r) => (
            <li key={r}>
              <ol className="flex gap-3 sm:gap-4">
                {row.map((p, k) => {
                  // Frames are numbered across the sheet, row by row.
                  const i = ROWS.slice(0, r).reduce((sum, prev) => sum + prev.length, 0) + k + 1;
                  return (
                    <li key={p.name} className="flex w-min min-w-0 flex-col items-start">
                      {/* eslint-disable-next-line @next/next/no-img-element -- static WebPs printed at build; the sheet is the hero picture */}
                      <img
                        src={`/screens/riso/${p.name}.webp`}
                        width={p.w}
                        height={p.h}
                        alt={p.alt}
                        decoding="async"
                        fetchPriority={i <= 3 ? 'high' : 'auto'}
                        className="block h-[92px] w-auto max-w-none animate-[ink-in_.6s_ease-out_both] sm:h-[150px] lg:h-[146px]"
                        style={{ animationDelay: `${120 + i * 110}ms` }}
                      />
                      <p className="type-cond mt-1.5 flex items-baseline gap-1.5 text-[12px] leading-4 sm:text-[13px]">
                        <span className="font-black text-frame-no tabular-nums">{i}</span>
                        <span className="text-muted">
                          {/* A caption may break after the folder, so it stays as wide as its frame. */}
                          {p.file.split('/')[0]}/<wbr />
                          {p.file.split('/')[1]}
                        </span>
                      </p>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="mt-3 text-sm text-muted">This site’s own pages, printed in two inks. Your screenshots stay in full colour.</figcaption>
    </figure>
  );
}

export default ProofSheet;
