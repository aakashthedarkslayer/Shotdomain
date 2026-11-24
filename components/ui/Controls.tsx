'use client';

import type { ReactNode } from 'react';

/** Toggle switch. */
export function Switch({
  checked,
  onChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-line-strong'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-surface shadow-[0_1px_2px_#00000033] transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

/** Checkbox styled to match the design tokens. */
export function Checkbox({
  checked,
  onChange,
  label,
  className = '',
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      aria-label={label}
      onChange={(e) => onChange?.(e.target.checked)}
      className={`h-4 w-4 shrink-0 cursor-pointer rounded accent-[var(--primary)] ${className}`}
    />
  );
}

/** Segmented control: one choice out of a few. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-subtle p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer rounded-[4px] font-medium transition-colors ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]'
            } ${active ? 'bg-surface text-fg shadow-[var(--shadow-card)]' : 'text-muted hover:text-fg'}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'success' }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${tone === 'success' ? 'bg-success' : 'bg-primary'}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
