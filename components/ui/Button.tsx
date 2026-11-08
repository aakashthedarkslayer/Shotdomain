import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98] disabled:active:scale-100';

    const sizeStyles = {
      sm: 'text-xs h-8 px-3 gap-1.5 font-mono',
      md: 'text-xs sm:text-sm h-10 px-4 gap-2 font-mono',
      lg: 'text-sm sm:text-base h-12 px-6 gap-2.5 font-mono font-semibold',
    }[size];

    const variantStyles = {
      primary:
        'bg-[#E54D2E] hover:bg-[#d03f22] text-white shadow-xs focus-visible:ring-[#E54D2E] dark:bg-[#E54D2E] dark:hover:bg-[#d03f22]',
      secondary:
        'bg-stone-100 hover:bg-stone-200 text-stone-800 focus-visible:ring-stone-400 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-100',
      outline:
        'border border-stone-300 hover:border-stone-400 hover:bg-stone-50 text-stone-800 focus-visible:ring-stone-400 bg-white dark:bg-stone-900 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800',
      ghost:
        'text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus-visible:ring-stone-400 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-0.5 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
