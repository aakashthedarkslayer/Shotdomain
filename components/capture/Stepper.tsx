import { Icon } from '@/components/ui/Icon';

const STEPS = ['Website', 'Pages', 'Settings', 'Capture', 'Results'];

/**
 * The five steps as a row of frames: done frames are black with a tick, the
 * current one is circled in marker red, the rest wait in outline.
 */
export function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((label, idx) => {
          const num = idx + 1;
          const done = current > num;
          const active = current === num;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 last:flex-none">
              <div className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs text-xs font-extrabold tabular-nums transition-colors ${
                    done
                      ? 'bg-primary text-primary-fg'
                      : active
                        ? 'border-2 border-accent bg-surface text-fg'
                        : 'border border-line-strong text-faint'
                  }`}
                >
                  {done ? <Icon name="check" size={14} strokeWidth={2.5} /> : num}
                </span>
                <span
                  className={`type-narrow hidden text-[15px] whitespace-nowrap sm:inline ${
                    active ? 'font-extrabold text-fg' : done ? 'font-semibold text-fg' : 'text-faint'
                  }`}
                >
                  {label}
                </span>
              </div>
              {num < STEPS.length && <span className={`h-px flex-1 ${done ? 'bg-primary' : 'bg-line-strong'}`} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Stepper;
