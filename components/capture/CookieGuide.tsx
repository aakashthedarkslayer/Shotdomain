'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

/*
 * Animated, illustrated walkthrough of copying session cookies:
 * a mock browser + Chrome DevTools, with a cursor that moves to each target.
 * Pure markup/CSS (no video). Respects prefers-reduced-motion.
 */

const PHASE_MS = 1150;
const PHASES = 4; // 3 action phases + 1 hold
/** The step shown first when motion is reduced: the copy step, in both methods. */
const STILL_STEP = 3;

interface Step {
  title: string;
  body: ReactNode;
  /** data-guide target the cursor moves to in each phase (null = hide cursor). */
  cursor: (string | null)[];
  /** phases in which the cursor "clicks". */
  clicks: number[];
}

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded-md border border-line-strong bg-surface-strong px-1.5 py-0.5 font-mono text-[11px] text-fg shadow-[0_1px_0_var(--line-strong)]">
    {children}
  </kbd>
);

const CURL_STEPS: Step[] = [
  {
    title: 'Log in to the site as usual',
    body: 'Open the site in Chrome or Edge and sign in, with two-factor or single sign-on if it uses them.',
    cursor: [null, 'login-btn', 'login-btn', null],
    clicks: [2],
  },
  {
    title: 'Open DevTools',
    body: (
      <>
        Press <Kbd>Ctrl</Kbd> <Kbd>Shift</Kbd> <Kbd>I</Kbd> (Mac: <Kbd>⌘</Kbd> <Kbd>⌥</Kbd> <Kbd>I</Kbd>), or right-click the page → <b>Inspect</b>.
      </>
    ),
    cursor: [null, null, null, null],
    clicks: [],
  },
  {
    title: 'Network → Doc → reload',
    body: (
      <>
        Click the <b>Network</b> tab, then the <b>Doc</b> filter, then press <Kbd>F5</Kbd> to reload.
      </>
    ),
    cursor: ['network-tab', 'doc-chip', 'doc-chip', 'doc-chip'],
    clicks: [0, 1],
  },
  {
    title: 'Right-click → Copy → Copy as cURL',
    body: (
      <>
        Right-click the page request, choose <b>Copy</b>, then <b>Copy as cURL</b>. On Windows you’ll see “cmd” and “bash”: either works.
      </>
    ),
    cursor: ['request-row', 'copy-menu', 'copy-curl', 'copy-curl'],
    clicks: [0, 2],
  },
  {
    title: 'Paste it into ShotDomain',
    body: 'Paste the whole thing and click Test login. ShotDomain keeps just your cookies and login headers, so you don’t need to know which cookie logs you in.',
    cursor: ['paste-box', 'test-btn', 'test-btn', null],
    clicks: [0, 1],
  },
];

/** Application tab: copy the one cookie that keeps you logged in. */
const APP_STEPS: Step[] = [
  CURL_STEPS[0],
  CURL_STEPS[1],
  {
    title: 'Application → Cookies → your site',
    body: (
      <>
        Open the <b>Application</b> tab (under <b>»</b> if it’s hidden). In the left panel, expand <b>Storage → Cookies</b> and click your
        site’s address.
      </>
    ),
    cursor: ['app-tab', 'cookies-node', 'site-node', 'site-node'],
    clicks: [0, 1, 2],
  },
  {
    title: 'Copy the login cookie’s value',
    body: (
      <>
        Find the cookie with <b>session</b>, <b>auth</b> or <b>token</b> in its name. Double-click its <b>Value</b> and press <Kbd>Ctrl</Kbd>{' '}
        <Kbd>C</Kbd>. Not sure which one? Use <b>Copy as cURL</b> to copy them all at once.
      </>
    ),
    cursor: ['session-name', 'session-value', 'session-value', 'session-value'],
    clicks: [1],
  },
  {
    title: 'Paste it into ShotDomain',
    body: (
      <>
        Choose <b>Enter its name and value</b>, type the cookie’s name, paste the value, then click <b>Test login</b>.
      </>
    ),
    cursor: ['name-box', 'value-box', 'test-btn', null],
    clicks: [0, 1, 2],
  },
];

export type GuideMethod = 'curl' | 'application';

function Cursor({ x, y, visible, clicking }: { x: number; y: number; visible: boolean; clicking: boolean }) {
  return (
    // A frame-sized layer moved by transform: its percentages are the frame's, so nothing animates left or top.
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 transition-[transform,opacity] duration-700 ease-[cubic-bezier(.5,0,.2,1)]"
      style={{ transform: `translate(${x}%, ${y}%)`, opacity: visible ? 1 : 0 }}
    >
      {clicking && <span className="absolute -top-3 -left-3 h-6 w-6 animate-ping rounded-full bg-accent/50" />}
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="drop-shadow-glyph">
        <path d="M4 2l15 9-6.5 1.5L9 19z" fill="var(--gray-0)" stroke="var(--gray-900)" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- scenes */

function BrowserChrome({ loggedIn, children }: { loggedIn: boolean; children: ReactNode }) {
  // A stand-in site drawn in greys: a page with a header, a heading and a row of cards.
  return (
    <div className="absolute inset-0 flex flex-col bg-shot-paper text-guide-ink">
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between bg-guide-site px-3 py-[2.2%] text-[10px] font-semibold text-shot-paper">
          <span>YourSite</span>
          {loggedIn ? (
            <span className="flex items-center gap-1 rounded-full bg-guide-key py-0.5 pr-2 pl-0.5 text-[9px]">
              <span className="h-3.5 w-3.5 rounded-full bg-guide-edge" /> Signed in
            </span>
          ) : (
            <span data-guide="login-btn" className="rounded bg-shot-paper px-2 py-0.5 text-[9px] text-guide-ink">
              Log in
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-[4%]">
          <div className="h-[6%] w-2/5 rounded bg-guide-ink" />
          <div className="h-[3.5%] w-3/5 rounded bg-guide-line" />
          <div className="h-[3.5%] w-1/2 rounded bg-guide-line" />
          <div className="grid flex-1 grid-cols-3 gap-[3%] pt-[2%]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-1.5 rounded-md border border-guide-line p-[6%]">
                <div className={`flex-1 rounded ${loggedIn ? 'bg-guide-edge' : 'bg-guide-tile'}`} />
                <div className="h-1.5 w-3/4 rounded bg-guide-line" />
                <div className="h-1.5 w-1/2 rounded bg-guide-line" />
              </div>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function DevTools({ step, phase }: { step: number; phase: number }) {
  const networkOn = step > 2 || (step === 2 && phase >= 0);
  const docOn = step > 2 || (step === 2 && phase >= 1);
  const rowShown = step > 2 || (step === 2 && phase >= 2);
  const rowSelected = step === 3;
  const menuOpen = step === 3 && phase <= 2;
  const copyHot = step === 3 && phase >= 1 && phase <= 2;
  const curlHot = step === 3 && phase === 2;
  const copied = step === 3 && phase >= 3;
  const tabs = ['Elements', 'Console', 'Sources', 'Network', 'Application'];
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex h-[58%] flex-col border-t border-slate-600 bg-devtools text-[9px] text-slate-300 animate-[guide-slide-up_.45s_ease-out]">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-700 px-2 py-1">
        {tabs.map((t) => (
          <span
            key={t}
            data-guide={t === 'Network' ? 'network-tab' : undefined}
            className={`pb-0.5 ${t === 'Network' && networkOn ? 'border-b-2 border-sky-400 text-white' : ''}`}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1 border-b border-slate-700 px-2 py-1">
        {['All', 'Fetch/XHR', 'Doc', 'CSS', 'JS'].map((c) => (
          <span
            key={c}
            data-guide={c === 'Doc' ? 'doc-chip' : undefined}
            className={`rounded px-1.5 py-px ${c === 'Doc' && docOn ? 'bg-sky-700 text-white' : c === 'All' && !docOn ? 'bg-slate-600 text-white' : 'bg-slate-700/60'}`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="grid grid-cols-[38%_14%_14%_1fr] border-b border-slate-700 px-2 py-0.5 text-slate-400">
          <span>Name</span>
          <span>Status</span>
          <span>Type</span>
          <span>Size</span>
        </div>
        {rowShown ? (
          <div
            className={`grid grid-cols-[38%_14%_14%_1fr] items-center px-2 py-1 animate-[guide-fade-in_.35s_ease-out] ${rowSelected ? 'bg-sky-900/70 text-white' : ''}`}
          >
            <span data-guide="request-row" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-sky-400" /> dashboard
            </span>
            <span>200</span>
            <span>document</span>
            <span>14.2 kB</span>
          </div>
        ) : (
          <div className="pt-4 text-center text-slate-400">Reload to record requests</div>
        )}
        {menuOpen && (
          <div className="absolute top-[24%] left-[14%] z-20 flex items-start animate-[guide-fade-in_.2s_ease-out]">
            <div className="w-28 rounded-md border border-slate-600 bg-devtools-menu py-1">
              <div className="px-2 py-0.5 text-slate-400">Open in new tab</div>
              <div className="px-2 py-0.5 text-slate-400">Clear browser cache</div>
              <div className="my-0.5 border-t border-slate-600" />
              <div data-guide="copy-menu" className={`flex justify-between px-2 py-0.5 ${copyHot ? 'bg-sky-700 text-white' : 'text-slate-300'}`}>
                Copy <span>▸</span>
              </div>
              <div className="px-2 py-0.5 text-slate-400">Block request URL</div>
            </div>
            {copyHot && (
              <div className="-ml-1 mt-[22px] w-32 rounded-md border border-slate-600 bg-devtools-menu py-1 animate-[guide-fade-in_.2s_ease-out]">
                <div className="px-2 py-0.5 text-slate-400">Copy URL</div>
                <div data-guide="copy-curl" className={`px-2 py-0.5 ${curlHot ? 'bg-sky-700 text-white' : 'text-slate-200'}`}>
                  Copy as cURL
                </div>
                <div className="px-2 py-0.5 text-slate-400">Copy as fetch</div>
              </div>
            )}
          </div>
        )}
        {copied && (
          <div className="absolute right-2 bottom-2 rounded-md bg-success px-2 py-0.5 font-semibold text-on-status animate-[guide-fade-in_.25s_ease-out]">
            ✓ Copied
          </div>
        )}
      </div>
    </div>
  );
}

function AppDevTools({ step, phase }: { step: number; phase: number }) {
  const appOn = step > 2 || (step === 2 && phase >= 0);
  const cookiesOpen = step > 2 || (step === 2 && phase >= 1);
  const siteOn = step > 2 || (step === 2 && phase >= 2);
  const rowHot = step === 3;
  const valueSelected = step === 3 && phase >= 1;
  const copied = step === 3 && phase >= 3;
  const tabs = ['Elements', 'Console', 'Sources', 'Network', 'Application'];
  const rows = [
    { name: '_ga', value: 'GA1.1.811289…' },
    { name: 'session_id', value: 'a8f3e1c94b7d…', login: true },
    { name: 'theme', value: 'dark' },
  ];
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex h-[58%] flex-col border-t border-slate-600 bg-devtools text-[9px] text-slate-300 animate-[guide-slide-up_.45s_ease-out]">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-700 px-2 py-1">
        {tabs.map((t) => (
          <span
            key={t}
            data-guide={t === 'Application' ? 'app-tab' : undefined}
            className={`pb-0.5 ${t === 'Application' && appOn ? 'border-b-2 border-sky-400 text-white' : ''}`}
          >
            {t}
          </span>
        ))}
      </div>
      {appOn ? (
        <div className="flex min-h-0 flex-1">
          <div className="w-[32%] space-y-0.5 border-r border-slate-700 px-1.5 py-1">
            <div className="text-slate-400">Application</div>
            <div className="pl-2">Manifest</div>
            <div className="pt-0.5 text-slate-400">Storage</div>
            <div className="pl-2">▸ Local storage</div>
            <div data-guide="cookies-node" className={`pl-2 ${cookiesOpen ? 'text-white' : ''}`}>
              {cookiesOpen ? '▾' : '▸'} Cookies
            </div>
            {cookiesOpen && (
              <div
                data-guide="site-node"
                className={`ml-4 truncate rounded px-1 animate-[guide-fade-in_.3s_ease-out] ${siteOn ? 'bg-sky-900/80 text-white' : ''}`}
              >
                https://yoursite.com
              </div>
            )}
          </div>
          <div className="relative flex-1 overflow-hidden">
            {siteOn ? (
              <>
                <div className="grid grid-cols-[38%_62%] border-b border-slate-700 bg-slate-800/60 px-2 py-0.5 text-slate-400">
                  <span>Name</span>
                  <span>Value</span>
                </div>
                {rows.map((r) => (
                  <div
                    key={r.name}
                    className={`grid grid-cols-[38%_62%] items-center border-b border-slate-800 px-2 py-[3px] animate-[guide-fade-in_.3s_ease-out] ${
                      r.login && rowHot ? 'bg-amber-400/15' : ''
                    }`}
                  >
                    <span data-guide={r.login ? 'session-name' : undefined} className={`flex items-center gap-1 truncate ${r.login && rowHot ? 'text-amber-200' : ''}`}>
                      <span className="truncate font-mono">{r.name}</span>
                      {r.login && rowHot && <span className="rounded bg-amber-400 px-1 text-[7px] font-semibold text-slate-900">Login</span>}
                    </span>
                    <span
                      data-guide={r.login ? 'session-value' : undefined}
                      className={`truncate font-mono ${r.login && valueSelected ? 'rounded-sm bg-sky-700 px-0.5 text-white ring-1 ring-sky-300' : ''}`}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
                {copied && (
                  <div className="absolute right-2 bottom-2 rounded-md bg-success px-2 py-0.5 font-semibold text-on-status animate-[guide-fade-in_.25s_ease-out]">
                    ✓ Copied
                  </div>
                )}
              </>
            ) : (
              <div className="pt-6 text-center text-slate-400">Select a site under Cookies</div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 pt-6 text-center text-slate-400">Elements</div>
      )}
    </div>
  );
}

function KeysOverlay({ phase, keys }: { phase: number; keys: string[] }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-scrim">
      {keys.map((k, i) => (
        <span
          key={k}
          className={`rounded-lg border-b-4 px-3 py-2 font-mono text-sm font-semibold shadow-lg transition-[transform,background-color,border-color,color] duration-200 ${
            phase >= i ? 'translate-y-0.5 border-guide-ink bg-guide-key text-shot-paper' : 'border-guide-edge bg-shot-paper text-guide-ink'
          }`}
        >
          {k}
        </span>
      ))}
    </div>
  );
}

function ShotDomainScene({ phase }: { phase: number }) {
  const pasted = phase >= 0;
  const read = phase >= 1;
  const tested = phase >= 2;
  return (
    <div className="band-dark absolute inset-0 flex flex-col gap-2 p-[4%] text-[10px] text-fg">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-fg">
        <span className="h-3.5 w-3.5 rounded bg-fg" /> This site needs a login
      </div>
      <div className="text-muted">Your copied request or cookies</div>
      <div data-guide="paste-box" className="min-h-[22%] rounded-lg border border-accent/60 bg-field p-2 font-mono text-[9px] leading-relaxed">
        {!pasted ? (
          <span className="text-muted">Paste here…</span>
        ) : read ? (
          <span key="read" className="animate-[guide-fade-in_.4s_ease-out]">session_id=a8f3e1…; _ga=GA1.1.811…; theme=dark</span>
        ) : (
          <span key="curl" className="animate-[guide-fade-in_.4s_ease-out]">
            curl &apos;https://yoursite.com/dashboard&apos; -H &apos;accept: text/html&apos; -b &apos;session_id=a8f3e1…; _ga=GA1.1.811…; theme=dark&apos; -H
            &apos;user-agent: Mozilla/5.0…&apos;
          </span>
        )}
      </div>
      {read && (
        <div className="space-y-1 rounded-lg bg-accent-soft px-2 py-1.5 animate-[guide-fade-in_.4s_ease-out]">
          <div className="font-semibold text-fg">✓ Read your copied cURL: kept 3 cookies, left out 12 browser headers</div>
          <div className="flex flex-wrap items-center gap-1 text-muted">
            Likely login:
            <span className="rounded bg-accent-soft px-1 font-mono text-accent">session_id</span>
            <span className="ml-1 text-muted line-through">_ga</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span data-guide="test-btn" className="rounded-md border border-line bg-subtle px-2 py-1">
          ↻ Test login
        </span>
        {tested && (
          <span className="rounded-md bg-subtle px-2 py-1 font-semibold text-fg animate-[guide-fade-in_.3s_ease-out]">
            ✓ Looks logged in
          </span>
        )}
      </div>
    </div>
  );
}

function ShotDomainFieldsScene({ phase }: { phase: number }) {
  const named = phase >= 0;
  const pasted = phase >= 1;
  const tested = phase >= 2;
  return (
    <div className="band-dark absolute inset-0 flex flex-col gap-2 p-[4%] text-[10px] text-fg">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-fg">
        <span className="h-3.5 w-3.5 rounded bg-fg" /> This site needs a login
      </div>
      <div className="flex items-center justify-between text-muted">
        <span>Session cookies</span>
        <span className="text-accent">Enter its name and value</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span data-guide="name-box" className={`w-[34%] rounded-md border bg-field px-2 py-1.5 text-[9px] ${phase === 0 ? 'border-accent' : 'border-line'}`}>
          {named ? <span className="font-mono animate-[guide-fade-in_.4s_ease-out]">session_id</span> : <span className="text-muted">cookie name</span>}
        </span>
        <span className="text-muted">=</span>
        <span data-guide="value-box" className={`flex-1 truncate rounded-md border bg-field px-2 py-1.5 text-[9px] ${phase === 1 ? 'border-accent' : 'border-line'}`}>
          {pasted ? <span className="font-mono animate-[guide-fade-in_.4s_ease-out]">a8f3e1c94b7d…</span> : <span className="text-muted">paste the value only</span>}
        </span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <span data-guide="test-btn" className="rounded-md border border-line bg-subtle px-2 py-1">
          ↻ Test login
        </span>
        {tested && (
          <span className="rounded-md bg-subtle px-2 py-1 font-semibold text-fg animate-[guide-fade-in_.3s_ease-out]">
            ✓ Looks logged in
          </span>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- guide */

export function CookieGuide({ initialMethod = 'curl' }: { initialMethod?: GuideMethod } = {}) {
  const [method, setMethod] = useState<GuideMethod>(initialMethod);
  const steps = method === 'application' ? APP_STEPS : CURL_STEPS;
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [systemReduced, setSystemReduced] = useState(false);
  // Visitors with "reduce animations" on can still choose to play it.
  const [forceMotion, setForceMotion] = useState(false);
  const reduced = systemReduced && !forceMotion;
  const frameRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50, visible: false });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Without autoplay, open on the step that shows the most (the copy step), not the bare site.
    const apply = (first = false) => {
      setSystemReduced(mq.matches);
      if (first && mq.matches) setStep(STILL_STEP);
    };
    const onChange = () => apply();
    apply(true);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // With reduced motion: no autoplay, each step shows its final state.
  const shownPhase = reduced ? PHASES - 1 : phase;

  useEffect(() => {
    if (!playing || reduced) return;
    const t = setTimeout(() => {
      if (phase < PHASES - 1) setPhase((p) => p + 1);
      else {
        setStep((s) => (s + 1) % steps.length);
        setPhase(0);
      }
    }, PHASE_MS);
    return () => clearTimeout(t);
  }, [playing, reduced, phase, step, steps.length]);

  // Move the cursor to this phase's target element.
  useLayoutEffect(() => {
    const target = steps[step].cursor[shownPhase] ?? null;
    const frame = frameRef.current;
    const el = target && frame?.querySelector<HTMLElement>(`[data-guide="${target}"]`);
    if (!frame || !el || reduced) {
      setCursor((c) => ({ ...c, visible: false }));
      return;
    }
    const f = frame.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCursor({ x: ((r.left + r.width / 2 - f.left) / f.width) * 100, y: ((r.top + r.height / 2 - f.top) / f.height) * 100, visible: true });
  }, [step, shownPhase, reduced, steps]);

  const go = useCallback(
    (s: number) => {
      setStep((s + steps.length) % steps.length);
      setPhase(0);
    },
    [steps.length],
  );

  const switchMethod = (m: GuideMethod) => {
    setMethod(m);
    setStep(reduced ? STILL_STEP : 0);
    setPhase(0);
  };

  const current = steps[step];
  const clicking = !reduced && current.clicks.includes(phase);

  let scene: ReactNode;
  if (step === 4) scene = method === 'application' ? <ShotDomainFieldsScene phase={shownPhase} /> : <ShotDomainScene phase={shownPhase} />;
  else
    scene = (
      <BrowserChrome loggedIn={step > 0 || shownPhase >= 2}>
        {step === 1 && shownPhase < 3 && <KeysOverlay phase={shownPhase} keys={['Ctrl', 'Shift', 'I']} />}
        {method === 'curl' && step === 2 && shownPhase === 2 && <KeysOverlay phase={0} keys={['F5']} />}
        {method === 'application' && step === 3 && shownPhase === 2 && <KeysOverlay phase={1} keys={['Ctrl', 'C']} />}
        {(step >= 2 || (step === 1 && shownPhase >= 3)) &&
          (method === 'application' ? <AppDevTools step={step} phase={shownPhase} /> : <DevTools step={step} phase={shownPhase} />)}
      </BrowserChrome>
    );

  return (
    <div className={`space-y-3 ${forceMotion ? 'allow-motion' : ''}`}>
      <div role="radiogroup" aria-label="Method" className="flex rounded-xl bg-subtle p-0.5 text-[13px]">
        {(
          [
            ['curl', 'Copy as cURL', 'easiest, copies everything'],
            ['application', 'Application tab', 'copy one cookie'],
          ] as const
        ).map(([m, label, hint]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={method === m}
            onClick={() => switchMethod(m)}
            className={`flex-1 cursor-pointer rounded-[4px] px-3 py-1.5 text-center whitespace-nowrap transition-colors ${
              method === m ? 'bg-surface-strong font-semibold text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            {label} <span className="ml-1 hidden text-xs font-normal text-muted sm:inline lg:hidden xl:inline">{hint}</span>
          </button>
        ))}
      </div>
      <div
        ref={frameRef}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line shadow-inner"
        role="img"
        aria-label={`Step ${step + 1} of ${steps.length}: ${current.title}`}
      >
        {/* A picture of a browser: its tiny labels are illustration, and the caption below says each step in words. */}
        <div key={`${method}-${step}`} aria-hidden="true" className="absolute inset-0 animate-[guide-fade-in_.35s_ease-out]">
          {scene}
        </div>
        <Cursor x={cursor.x} y={cursor.y} visible={cursor.visible} clicking={clicking} />
      </div>

      {/* Reduced motion: the guide stays on its first frame, and the choice to play sits beside it, never over it. */}
      {reduced && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2">
          <span className="text-[13px] text-muted">Animations are reduced on this device.</span>
          <button
            type="button"
            onClick={() => {
              setForceMotion(true);
              setPlaying(true);
              setPhase(0);
            }}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-[13px] font-semibold text-fg transition-colors hover:bg-subtle active:translate-y-px"
          >
            <Icon name="play" size={13} />
            Play walkthrough
          </button>
        </div>
      )}

      {/* Step progress: fills over each step while playing */}
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div
          key={`${method}-${step}-${reduced}`}
          // duration = PHASE_MS × PHASES (kept in the class so the reduced-motion opt-in can restore it)
          className={`bg-primary h-full w-full origin-left rounded-full ${reduced ? 'opacity-40' : 'animate-[guide-progress_4600ms_linear_forwards]'}`}
          style={reduced ? undefined : { animationPlayState: playing ? 'running' : 'paused' }}
        />
      </div>

      <div className="min-h-[3.5rem]">
        <div className="text-sm font-semibold text-fg">
          <span className="mr-1.5 text-muted">Step {step + 1} of {steps.length}:</span>
          {current.title}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{current.body}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="-ml-[9px] flex items-center">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Go to step ${i + 1}: ${s.title}`}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => go(i)}
              className="group flex h-6 min-w-6 cursor-pointer items-center justify-center px-[9px]"
            >
              {/* 24 px tap target around a small dot */}
              <span className={`h-1.5 rounded-full transition-colors ${i === step ? 'bg-primary w-6' : 'w-1.5 bg-line-strong group-hover:bg-muted'}`} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous step" onClick={() => go(step - 1)} className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-subtle hover:text-fg">
            <Icon name="arrowLeft" size={14} />
          </button>
          {!reduced && (
            <button
              type="button"
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={() => setPlaying((p) => !p)}
              className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-subtle hover:text-fg"
            >
              <Icon name={playing ? 'pause' : 'play'} size={14} />
            </button>
          )}
          <button type="button" aria-label="Next step" onClick={() => go(step + 1)} className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-subtle hover:text-fg">
            <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieGuide;
