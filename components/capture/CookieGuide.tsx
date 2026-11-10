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

const STEPS: Step[] = [
  {
    title: 'Log in to the site as usual',
    body: 'Open the site in Chrome or Edge and sign in — with 2FA or SSO if it uses them.',
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
    title: 'Copy the cookie line',
    body: (
      <>
        Click the page request → <b>Headers</b>. Under <b>Request Headers</b>, right-click <b>cookie</b> → <b>Copy value</b>.
      </>
    ),
    cursor: ['request-row', 'cookie-line', 'copy-value', 'copy-value'],
    clicks: [0, 1, 2],
  },
  {
    title: 'Paste it into ShotDomain',
    body: 'Paste into “All cookies for this site” and click Test login. You don’t need to know which cookie logs you in.',
    cursor: ['paste-box', 'test-btn', 'test-btn', null],
    clicks: [0, 1],
  },
];

function Cursor({ x, y, visible, clicking }: { x: number; y: number; visible: boolean; clicking: boolean }) {
  return (
    <div
      className="pointer-events-none absolute z-30 transition-all duration-700 ease-[cubic-bezier(.5,0,.2,1)]"
      style={{ left: `${x}%`, top: `${y}%`, opacity: visible ? 1 : 0 }}
    >
      {clicking && <span className="absolute -top-3 -left-3 h-6 w-6 animate-ping rounded-full bg-accent/50" />}
      <svg width="18" height="18" viewBox="0 0 24 24" className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
        <path d="M4 2l15 9-6.5 1.5L9 19z" fill="white" stroke="black" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- scenes */

function BrowserChrome({ loggedIn, children }: { loggedIn: boolean; children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white text-slate-800">
      <div className="flex h-[9%] shrink-0 items-center gap-1.5 bg-slate-200 px-2">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        <div className="ml-2 flex h-[65%] flex-1 items-center gap-1 rounded-md bg-white px-2 text-[9px] text-slate-500">
          <Icon name="shield" size={9} /> yoursite.com/dashboard
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex items-center justify-between bg-indigo-600 px-3 py-[2.2%] text-[10px] font-semibold text-white">
          <span>YourSite</span>
          {loggedIn ? (
            <span className="flex items-center gap-1 rounded-full bg-white/20 py-0.5 pr-2 pl-0.5 text-[9px]">
              <span className="h-3.5 w-3.5 rounded-full bg-amber-300" /> Signed in
            </span>
          ) : (
            <span data-guide="login-btn" className="rounded bg-white px-2 py-0.5 text-[9px] text-indigo-700">
              Log in
            </span>
          )}
        </div>
        <div className="space-y-1.5 p-3">
          <div className="h-2 w-1/3 rounded bg-slate-700" />
          <div className="h-1.5 w-2/3 rounded bg-slate-200" />
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-8 rounded ${loggedIn ? 'bg-indigo-100' : 'bg-slate-100'}`} />
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
  const cookieHot = step === 3 && phase >= 1;
  const menuOpen = step === 3 && phase === 2;
  const copied = step === 3 && phase >= 3;
  const tabs = ['Elements', 'Console', 'Sources', 'Network', 'Application'];
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex h-[58%] flex-col border-t border-slate-600 bg-[#202124] text-[9px] text-slate-300 animate-[guide-slide-up_.45s_ease-out]">
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
            className={`rounded px-1.5 py-px ${c === 'Doc' && docOn ? 'bg-sky-500 text-white' : c === 'All' && !docOn ? 'bg-slate-600 text-white' : 'bg-slate-700/60'}`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-[38%] border-r border-slate-700">
          <div className="border-b border-slate-700 px-2 py-0.5 text-slate-500">Name</div>
          {rowShown && (
            <div
              data-guide="request-row"
              className={`flex items-center gap-1 px-2 py-1 animate-[guide-fade-in_.35s_ease-out] ${rowSelected ? 'bg-sky-900/70 text-white' : ''}`}
            >
              <span className="h-2 w-2 rounded-sm bg-sky-400" /> dashboard
            </div>
          )}
        </div>
        <div className="relative flex-1 space-y-0.5 overflow-hidden px-2 py-1 font-mono">
          {rowSelected ? (
            <>
              <div className="font-sans font-semibold text-slate-200">▾ Request Headers</div>
              <div>
                <span className="text-sky-300">accept:</span> text/html
              </div>
              <div
                data-guide="cookie-line"
                className={`truncate rounded px-0.5 transition-colors ${cookieHot ? 'bg-amber-400/25 text-amber-100 ring-1 ring-amber-300/70' : ''}`}
              >
                <span className="text-sky-300">cookie:</span> session_id=a8f3…; _ga=GA1.1…
              </div>
              <div>
                <span className="text-sky-300">user-agent:</span> Mozilla/5.0…
              </div>
              {menuOpen && (
                <div className="absolute top-[30%] left-[34%] z-20 w-28 rounded-md border border-slate-600 bg-[#2a2b2e] py-1 font-sans shadow-xl animate-[guide-fade-in_.2s_ease-out]">
                  <div className="px-2 py-0.5 text-slate-400">Copy name</div>
                  <div data-guide="copy-value" className="bg-sky-600 px-2 py-0.5 text-white">
                    Copy value
                  </div>
                  <div className="px-2 py-0.5 text-slate-400">Copy as fetch</div>
                </div>
              )}
              {copied && (
                <div className="absolute right-2 bottom-2 rounded-md bg-emerald-500 px-2 py-0.5 font-sans font-semibold text-white animate-[guide-fade-in_.25s_ease-out]">
                  ✓ Copied
                </div>
              )}
            </>
          ) : (
            <div className="pt-4 text-center font-sans text-slate-500">{rowShown ? 'Click a request to see its headers' : 'Reload to record requests'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function KeysOverlay({ phase, keys }: { phase: number; keys: string[] }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-slate-900/25">
      {keys.map((k, i) => (
        <span
          key={k}
          className={`rounded-lg border-b-4 px-3 py-2 font-mono text-sm font-semibold shadow-lg transition-all duration-200 ${
            phase >= i ? 'translate-y-0.5 border-indigo-800 bg-indigo-500 text-white' : 'border-slate-400 bg-white text-slate-700'
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
  const tested = phase >= 2;
  return (
    <div className="absolute inset-0 flex flex-col gap-2 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-[4%] text-[10px] text-slate-200">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
        <span className="h-3.5 w-3.5 rounded bg-gradient-to-br from-indigo-500 to-fuchsia-500" /> ShotDomain · This site needs a login
      </div>
      <div className="text-slate-400">All cookies for this site</div>
      <div data-guide="paste-box" className="min-h-[22%] rounded-lg border border-indigo-400/60 bg-white/5 p-2 font-mono text-[9px]">
        {pasted ? <span className="animate-[guide-fade-in_.4s_ease-out]">session_id=a8f3e1…; _ga=GA1.1.811…; theme=dark</span> : <span className="text-slate-500">Paste here…</span>}
      </div>
      {pasted && (
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-white/5 px-2 py-1.5 animate-[guide-fade-in_.4s_ease-out]">
          Found 3 cookies · Likely login:
          <span className="rounded bg-emerald-500/20 px-1 font-mono text-emerald-300">session_id</span>
          <span className="ml-1 text-slate-500 line-through">_ga</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span data-guide="test-btn" className="rounded-md border border-white/15 bg-white/10 px-2 py-1">
          ↻ Test login
        </span>
        {tested && (
          <span className="rounded-md bg-emerald-500/20 px-2 py-1 font-semibold text-emerald-300 animate-[guide-fade-in_.3s_ease-out]">
            ✓ Looks logged in
          </span>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- guide */

export function CookieGuide() {
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
    const apply = () => setSystemReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // With reduced motion: no autoplay, each step shows its final state.
  const shownPhase = reduced ? PHASES - 1 : phase;

  useEffect(() => {
    if (!playing || reduced) return;
    const t = setTimeout(() => {
      if (phase < PHASES - 1) setPhase((p) => p + 1);
      else {
        setStep((s) => (s + 1) % STEPS.length);
        setPhase(0);
      }
    }, PHASE_MS);
    return () => clearTimeout(t);
  }, [playing, reduced, phase, step]);

  // Move the cursor to this phase's target element.
  useLayoutEffect(() => {
    const target = STEPS[step].cursor[shownPhase] ?? null;
    const frame = frameRef.current;
    const el = target && frame?.querySelector<HTMLElement>(`[data-guide="${target}"]`);
    if (!frame || !el || reduced) {
      setCursor((c) => ({ ...c, visible: false }));
      return;
    }
    const f = frame.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCursor({ x: ((r.left + r.width / 2 - f.left) / f.width) * 100, y: ((r.top + r.height / 2 - f.top) / f.height) * 100, visible: true });
  }, [step, shownPhase, reduced]);

  const go = useCallback((s: number) => {
    setStep((s + STEPS.length) % STEPS.length);
    setPhase(0);
  }, []);

  const current = STEPS[step];
  const clicking = !reduced && current.clicks.includes(phase);

  let scene: ReactNode;
  if (step === 4) scene = <ShotDomainScene phase={shownPhase} />;
  else
    scene = (
      <BrowserChrome loggedIn={step > 0 || shownPhase >= 2}>
        {step === 1 && shownPhase < 3 && <KeysOverlay phase={shownPhase} keys={['Ctrl', 'Shift', 'I']} />}
        {step === 2 && shownPhase === 2 && <KeysOverlay phase={0} keys={['F5']} />}
        {(step >= 2 || (step === 1 && shownPhase >= 3)) && <DevTools step={step} phase={shownPhase} />}
      </BrowserChrome>
    );

  return (
    <div className={`space-y-3 ${forceMotion ? 'allow-motion' : ''}`}>
      <div
        ref={frameRef}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line shadow-inner"
        role="img"
        aria-label={`Step ${step + 1} of ${STEPS.length}: ${current.title}`}
      >
        <div key={step} className="absolute inset-0 animate-[guide-fade-in_.35s_ease-out]">
          {scene}
        </div>
        <Cursor x={cursor.x} y={cursor.y} visible={cursor.visible} clicking={clicking} />
        <span className="absolute top-2 right-2 z-40 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
          {step + 1} / {STEPS.length}
        </span>
        {reduced && (
          <button
            type="button"
            onClick={() => {
              setForceMotion(true);
              setPlaying(true);
              setPhase(0);
            }}
            className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/35 text-white backdrop-blur-[1px] transition hover:bg-black/25"
          >
            <span className="bg-brand flex h-14 w-14 items-center justify-center rounded-full shadow-lg">
              <Icon name="play" size={22} />
            </span>
            <span className="text-sm font-semibold">Play walkthrough</span>
            <span className="text-[11px] opacity-80">Animations are reduced on this device — click to play anyway</span>
          </button>
        )}
      </div>

      {/* Step progress: fills over each step while playing */}
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div
          key={`${step}-${reduced}`}
          // duration = PHASE_MS × PHASES (kept in the class so the reduced-motion opt-in can restore it)
          className={`bg-brand h-full rounded-full ${reduced ? 'w-full opacity-40' : 'animate-[guide-progress_4600ms_linear_forwards]'}`}
          style={reduced ? undefined : { animationPlayState: playing ? 'running' : 'paused' }}
        />
      </div>

      <div className="min-h-[3.5rem]">
        <div className="text-sm font-semibold text-fg">
          <span className="text-brand mr-1.5">Step {step + 1}.</span>
          {current.title}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{current.body}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Go to step ${i + 1}: ${s.title}`}
              onClick={() => go(i)}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${i === step ? 'bg-brand w-6' : 'w-1.5 bg-line-strong hover:bg-muted'}`}
            />
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
