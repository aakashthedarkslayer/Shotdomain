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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'border-primary bg-primary' : 'border-field-edge bg-subtle'
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] rounded-full shadow-knob transition-transform ${
          checked ? 'translate-x-[22px] bg-primary-fg' : 'translate-x-0.5 bg-surface-strong'
        }`}
      />
    </button>
  );
}

/** Checkbox: a picked item takes the china-marker red. */
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
      className={`h-4 w-4 shrink-0 cursor-pointer rounded-xs accent-[var(--accent)] ${className}`}
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
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line-strong bg-surface p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer rounded-[4px] font-semibold transition-colors ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]'
            } ${active ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg'}`}
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
    <div className="h-1.5 w-full overflow-hidden bg-subtle" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full w-full origin-left transition-transform duration-300 ease-out ${tone === 'success' ? 'bg-success' : 'bg-primary'}`}
        style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }}
      />
    </div>
  );
}
