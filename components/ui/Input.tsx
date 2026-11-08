import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefixIcon, suffixIcon, id, className = '', disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-slate-400 dark:text-slate-500">
              {prefixIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono text-stone-900 placeholder-stone-400 transition-all outline-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 dark:bg-stone-950 dark:text-stone-100 dark:placeholder-stone-500 dark:disabled:bg-stone-800/50 ${
              prefixIcon ? 'pl-10' : ''
            } ${suffixIcon ? 'pr-10' : ''} ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-800'
                : 'border-stone-300 hover:border-stone-400 focus:border-[#E54D2E] focus:ring-4 focus:ring-orange-500/10 dark:border-stone-700 dark:hover:border-stone-600 dark:focus:border-[#FF5733]'
            } ${className}`}
            {...props}
          />
          {suffixIcon && (
            <div className="pointer-events-none absolute right-3.5 flex items-center justify-center text-slate-400 dark:text-slate-500">
              {suffixIcon}
            </div>
          )}
        </div>
        {error ? (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-600 text-red-500 dark:text-rose-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
