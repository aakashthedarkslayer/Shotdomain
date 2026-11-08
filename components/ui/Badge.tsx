import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  }[size];

  const variantStyles = {
    default:
      'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 font-mono',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 font-mono',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 font-mono',
    error:
      'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40 font-mono',
    info:
      'bg-orange-50 text-[#E54D2E] border-orange-200/60 dark:bg-orange-950/40 dark:text-[#FF5733] dark:border-orange-800/40 font-mono',
    purple:
      'bg-stone-900 text-stone-100 border-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-200 font-mono',
  }[variant];

  const dotColors = {
    default: 'bg-stone-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-[#E54D2E]',
    purple: 'bg-stone-400',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors}`} />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
