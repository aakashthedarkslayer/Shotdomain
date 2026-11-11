import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

/*
 * Hero product shot: a results grid filled with miniature, hand-drawn
 * "screenshots" of different page types, framed per device. Pure markup —
 * no images to load.
 */

type Device = 'Desktop' | 'Tablet' | 'Mobile';

const bar = (w: string, extra = '') => <div className={`h-1.5 rounded-full bg-slate-300/80 ${w} ${extra}`} />;

function MiniNav({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-slate-200 px-2 py-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      <div className="ml-1 flex flex-1 gap-1.5">
        {bar('w-5')}
        {bar('w-4')}
        {bar('w-6')}
      </div>
      <span className={`h-2.5 w-7 rounded-full ${accent}`} />
    </div>
  );
}

const SITES: Record<string, (accent: string) => ReactNode> = {
  landing: (accent) => (
    <>
      <MiniNav accent={accent} />
      <div className="grid grid-cols-5 gap-2 p-3">
        <div className="col-span-3 space-y-1.5 pt-1">
          <div className="h-2.5 w-11/12 rounded-full bg-slate-800" />
          <div className="h-2.5 w-3/4 rounded-full bg-slate-800" />
          {bar('w-full', 'mt-2')}
          {bar('w-5/6')}
          <div className="flex gap-1.5 pt-1.5">
            <span className={`h-3 w-10 rounded-md ${accent}`} />
            <span className="h-3 w-10 rounded-md border border-slate-300" />
          </div>
        </div>
        <div className="col-span-2 rounded-lg bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-amber-200" />
      </div>
      <div className="flex justify-around px-3 pb-2 opacity-60">{['w-6', 'w-8', 'w-5', 'w-7', 'w-6'].map((w, i) => <div key={i} className={`h-1.5 rounded-full bg-slate-400 ${w}`} />)}</div>
    </>
  ),
  pricing: (accent) => (
    <>
      <MiniNav accent={accent} />
      <div className="space-y-1.5 p-2">
        <div className="mx-auto h-2 w-2/3 rounded-full bg-slate-800" />
        {[false, true, false].map((hot, i) => (
          <div key={i} className={`space-y-1 rounded-md border p-1.5 ${hot ? `border-transparent ${accent} bg-opacity-90` : 'border-slate-200'}`}>
            <div className={`h-1.5 w-1/3 rounded-full ${hot ? 'bg-white/90' : 'bg-slate-700'}`} />
            <div className={`h-2.5 w-1/2 rounded-full ${hot ? 'bg-white' : 'bg-slate-800'}`} />
            <div className={`h-1 w-3/4 rounded-full ${hot ? 'bg-white/60' : 'bg-slate-300'}`} />
          </div>
        ))}
      </div>
    </>
  ),
  about: (accent) => (
    <>
      <MiniNav accent={accent} />
      <div className="mx-2 mt-2 h-10 rounded-md bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200" />
      <div className="grid grid-cols-3 gap-2 p-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <div className={`h-3 w-3 rounded ${accent}`} />
            {bar('w-full')}
            {bar('w-4/5')}
          </div>
        ))}
      </div>
    </>
  ),
  blog: (accent) => (
    <>
      <MiniNav accent={accent} />
      <div className="space-y-1.5 p-2">
        {['from-rose-300 to-orange-200', 'from-violet-300 to-indigo-200', 'from-emerald-300 to-teal-200'].map((g, i) => (
          <div key={i} className="flex gap-1.5">
            <div className={`h-7 w-9 shrink-0 rounded bg-gradient-to-br ${g}`} />
            <div className="flex-1 space-y-1 pt-0.5">
              <div className="h-1.5 w-11/12 rounded-full bg-slate-700" />
              {bar('w-full')}
              {bar('w-2/3')}
            </div>
          </div>
        ))}
      </div>
    </>
  ),
  contact: (accent) => (
    <>
      <MiniNav accent={accent} />
      <div className="space-y-1.5 p-2">
        <div className="h-2 w-1/2 rounded-full bg-slate-800" />
        {bar('w-3/4')}
        {[0, 1].map((i) => (
          <div key={i} className="h-3.5 rounded border border-slate-300 bg-white" />
        ))}
        <div className="h-7 rounded border border-slate-300 bg-white" />
        <div className={`h-3.5 rounded ${accent}`} />
      </div>
    </>
  ),
  docs: (accent) => (
    <div className="flex h-full">
      <div className="w-1/4 space-y-1.5 border-r border-slate-200 bg-slate-50 p-1.5">
        <span className={`block h-2 w-2 rounded-full ${accent}`} />
        {['w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-full'].map((w, i) => (
          <div key={i} className={`h-1 rounded-full ${i === 2 ? accent : 'bg-slate-300'} ${w}`} />
        ))}
      </div>
      <div className="flex-1 space-y-1.5 p-2">
        <div className="h-2 w-1/2 rounded-full bg-slate-800" />
        {bar('w-full')}
        {bar('w-11/12')}
        <div className="space-y-1 rounded bg-slate-900 p-1.5">
          <div className="h-1 w-2/3 rounded-full bg-emerald-400/80" />
          <div className="h-1 w-1/2 rounded-full bg-sky-400/80" />
          <div className="h-1 w-3/4 rounded-full bg-fuchsia-400/80" />
        </div>
        {bar('w-5/6')}
      </div>
    </div>
  ),
  careers: (accent) => (
    <>
      <MiniNav accent={accent} />
      <div className="space-y-1.5 p-2">
        <div className="h-2.5 w-2/5 rounded-full bg-slate-800" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between rounded border border-slate-200 px-1.5 py-1">
            <div className="space-y-0.5">
              <div className="h-1.5 w-16 rounded-full bg-slate-700" />
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <span className={`h-2.5 w-6 rounded-full ${accent}`} />
          </div>
        ))}
      </div>
    </>
  ),
};

const DEVICE_ICON: Record<Device, IconName> = { Desktop: 'monitor', Tablet: 'tablet', Mobile: 'phone' };

interface TileProps {
  path: string;
  device: Device;
  site: keyof typeof SITES;
  accent: string;
  className?: string;
  badge?: { text: string; tone: 'warning' | 'success' };
}

function Tile({ path, device, site, accent, className = '', badge }: TileProps) {
  const page = <div className="h-full overflow-hidden bg-white text-left">{SITES[site](accent)}</div>;
  return (
    <div className={`glass group overflow-hidden rounded-xl transition duration-300 hover:-translate-y-1 ${className}`}>
      <div className="relative h-36 overflow-hidden border-b border-line bg-gradient-to-br from-slate-100 to-slate-200/70 sm:h-40 dark:from-slate-800/60 dark:to-slate-900/60">
        {device === 'Desktop' && <div className="absolute inset-2.5 overflow-hidden rounded-md shadow-sm ring-1 ring-black/5">{page}</div>}
        {device === 'Tablet' && (
          <div className="absolute inset-y-2.5 left-1/2 w-[62%] -translate-x-1/2 overflow-hidden rounded-lg border-[3px] border-slate-800 shadow-md">{page}</div>
        )}
        {device === 'Mobile' && (
          <div className="absolute inset-y-2.5 left-1/2 w-[38%] min-w-[5.5rem] -translate-x-1/2 overflow-hidden rounded-[0.9rem] border-[3px] border-slate-800 shadow-md">
            {page}
          </div>
        )}
        {badge && (
          <span
            className={`absolute top-2 left-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm ${
              badge.tone === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'
            }`}
          >
            {badge.tone === 'success' && <Icon name="shield" size={10} />}
            {badge.text}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate font-mono text-xs text-fg">{path}</span>
        <span className="flex items-center gap-1 text-[11px] text-muted">
          <Icon name={DEVICE_ICON[device]} size={12} />
          {device}
        </span>
      </div>
    </div>
  );
}

function FloatingChip({ icon, title, body, className }: { icon: IconName; title: string; body: string; className: string }) {
  return (
    <div className={`glass-strong absolute z-10 hidden items-center gap-2.5 rounded-xl px-3 py-2 lg:flex ${className}`}>
      <span className="bg-brand flex h-7 w-7 items-center justify-center rounded-lg text-white">
        <Icon name={icon} size={14} />
      </span>
      <div className="text-left">
        <div className="text-xs font-semibold text-fg">{title}</div>
        <div className="text-[11px] text-muted">{body}</div>
      </div>
    </div>
  );
}

export function ProductPreview() {
  return (
    <div className="relative">
      <FloatingChip icon="shield" title="Logged-in capture" body="Session cookies, no password" className="-left-14 top-36" />
      <FloatingChip icon="refresh" title="Change alert" body="3 pages changed since Monday" className="-right-12 top-52" />
      <FloatingChip icon="link" title="Share link copied" body="Anyone with the link can view" className="-bottom-8 right-32" />

      <div className="glass-strong overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="flex items-center gap-1.5 rounded-lg bg-subtle px-2.5 py-1 font-mono text-xs text-muted">
            <Icon name="globe" size={12} /> example.com · 24 screenshots
          </span>
          <div className="ml-auto hidden items-center gap-0.5 rounded-lg bg-subtle p-0.5 text-[11px] md:flex">
            {['All', 'Desktop', 'Tablet', 'Mobile'].map((t, i) => (
              <span key={t} className={`rounded-md px-2 py-0.5 ${i === 0 ? 'bg-surface-strong font-medium text-fg shadow-sm' : 'text-muted'}`}>
                {t}
              </span>
            ))}
          </div>
          <span className="bg-brand flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-white shadow-sm max-md:ml-auto">
            <Icon name="download" size={12} /> Download ZIP
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Tile path="/" device="Desktop" site="landing" accent="bg-indigo-500" className="col-span-2" badge={{ text: '2.4% changed', tone: 'warning' }} />
          <Tile path="/pricing" device="Mobile" site="pricing" accent="bg-violet-500" />
          <Tile path="/about" device="Desktop" site="about" accent="bg-sky-500" />
          <Tile path="/blog" device="Tablet" site="blog" accent="bg-rose-500" />
          <Tile path="/contact" device="Mobile" site="contact" accent="bg-emerald-500" />
          <Tile path="/app/dashboard" device="Tablet" site="docs" accent="bg-amber-500" badge={{ text: 'Logged in', tone: 'success' }} />
          <Tile path="/careers" device="Desktop" site="careers" accent="bg-fuchsia-500" />
        </div>
      </div>
    </div>
  );
}

export default ProductPreview;
