/*
 * The hero's strip of film: real frames from one ShotDomain capture (ShotDomain
 * run on its own site, on desktop, tablet and iPhone), each numbered on the
 * film in edge amber with the file name it has in the ZIP. The frames develop
 * once, in order, on load (opacity only; instant with reduced motion).
 * public/screens/README.md says how the frames were taken.
 */

interface Frame {
  src: string;
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

const FRAMES: Frame[] = [
  { src: '/screens/frames/desktop-home.webp', ...DESKTOP, file: 'desktop/home.png', alt: 'ShotDomain’s homepage on desktop' },
  { src: '/screens/frames/tablet-home.webp', ...TABLET, file: 'tablet/home.png', alt: 'The homepage on iPad Pro 11' },
  { src: '/screens/frames/mobile-ios-home.webp', ...PHONE, file: 'mobile-ios/home.png', alt: 'The homepage on iPhone 14 Pro' },
  { src: '/screens/frames/desktop-terms.webp', ...DESKTOP, file: 'desktop/terms.png', alt: 'The Terms of Service page on desktop' },
  { src: '/screens/frames/mobile-ios-terms.webp', ...PHONE, file: 'mobile-ios/terms.png', alt: 'The Terms of Service page on iPhone' },
  { src: '/screens/frames/desktop-privacy.webp', ...DESKTOP, file: 'desktop/privacy.png', alt: 'The Privacy Policy page on desktop' },
  { src: '/screens/frames/tablet-privacy.webp', ...TABLET, file: 'tablet/privacy.png', alt: 'The Privacy Policy page on iPad' },
  { src: '/screens/frames/desktop-login.webp', ...DESKTOP, file: 'desktop/login.png', alt: 'The sign-in page on desktop' },
  { src: '/screens/frames/mobile-ios-login.webp', ...PHONE, file: 'mobile-ios/login.png', alt: 'The sign-in page on iPhone' },
];

export function FilmStrip() {
  return (
    <figure className="m-0">
      <div
        className="film-strip overflow-x-auto overscroll-x-contain"
        // A scrollable region must take keyboard focus to be scrolled without a mouse.
        tabIndex={0}
        role="region"
        aria-label="Frames from one capture of this site, on desktop, tablet and iPhone"
      >
        <span aria-hidden="true" className="sprockets top-2" />
        <ol className="flex w-max gap-4 px-4 sm:gap-6 sm:px-6">
          {FRAMES.map((f, i) => (
            <li key={f.file} className="flex shrink-0 flex-col items-start">
              <div className="w-fit overflow-hidden rounded-xs bg-film-text/10">
                {/* eslint-disable-next-line @next/next/no-img-element -- static WebPs sized at build; the strip is the hero picture */}
                <img
                  src={f.src}
                  width={f.w}
                  height={f.h}
                  alt={f.alt}
                  decoding="async"
                  fetchPriority={i < 3 ? 'high' : 'auto'}
                  className="block h-[150px] w-auto animate-[develop_.6s_ease-out_both] sm:h-[180px] lg:h-[210px]"
                  style={{ animationDelay: `${150 + i * 110}ms` }}
                />
              </div>
              <p className="type-narrow mt-2 flex items-baseline gap-2 text-[13px] leading-4">
                <span className="font-extrabold text-edge-print tabular-nums">{i + 1}</span>
                <span className="text-film-text/80">{f.file}</span>
              </p>
            </li>
          ))}
        </ol>
        <span aria-hidden="true" className="sprockets bottom-2" />
      </div>
    </figure>
  );
}

export default FilmStrip;
