import { Icon } from '@/components/ui/Icon';

const STEPS = ['Website', 'Pages', 'Settings', 'Capture', 'Results'];

/** Compact horizontal progress for the 5-step flow. */
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
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition ${
                    done
                      ? 'bg-brand text-white'
                      : active
                        ? 'bg-brand text-white ring-4 ring-accent-soft'
                        : 'glass text-faint'
                  }`}
                >
                  {done ? <Icon name="check" size={13} strokeWidth={2.5} /> : num}
                </span>
                <span
                  className={`hidden text-sm whitespace-nowrap sm:inline ${
                    active ? 'font-medium text-fg' : done ? 'text-fg' : 'text-faint'
                  }`}
                >
                  {label}
                </span>
              </div>
              {num < STEPS.length && <span className={`h-px flex-1 ${done ? 'bg-brand' : 'bg-line-strong'}`} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Stepper;
