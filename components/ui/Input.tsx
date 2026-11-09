import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

const FIELD_BASE =
  'w-full rounded-xl border bg-field text-sm text-fg placeholder:text-faint transition outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName;
  invalid?: boolean;
  inputSize?: 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, invalid, inputSize = 'md', className = '', ...props },
  ref,
) {
  const height = inputSize === 'lg' ? 'h-11' : 'h-9';
  return (
    <div className="relative w-full">
      {icon && (
        <Icon name={icon} size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={`${FIELD_BASE} ${height} ${icon ? 'pl-9' : 'pl-3'} pr-3 ${
          invalid ? 'border-danger focus:ring-danger/15' : 'border-line hover:border-line-strong focus:border-accent focus:ring-accent/15'
        } ${className}`}
        {...props}
      />
    </div>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={`${FIELD_BASE} h-9 cursor-pointer appearance-none border-line pr-8 pl-3 hover:border-line-strong focus:border-accent focus:ring-accent/15 ${className}`}
        {...props}
      >
        {children}
      </select>
      <Icon name="chevronDown" size={14} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-faint" />
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = '', rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${FIELD_BASE} border-line px-3 py-2 font-mono text-[13px] hover:border-line-strong focus:border-accent focus:ring-accent/15 ${className}`}
      {...props}
    />
  );
});

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint/error, stacked. */
export function Field({ label, htmlFor, hint, error, children, className = '' }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export default Input;
