'use client';

import type { ReactNode } from 'react';

/** Toggle switch. */
export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-line-strong'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
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
      className={`h-4 w-4 shrink-0 cursor-pointer rounded accent-[var(--accent)] ${className}`}
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
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-subtle p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer rounded-md font-medium transition ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]'
            } ${active ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
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
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${tone === 'success' ? 'bg-success' : 'bg-accent'}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
