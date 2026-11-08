import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, Spinner } from './Icon';
import type { IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:opacity-90',
  secondary: 'border border-line bg-surface text-fg hover:bg-subtle',
  ghost: 'text-muted hover:bg-subtle hover:text-fg',
  danger: 'border border-line bg-surface text-danger hover:bg-danger-soft',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-2.5 text-[13px]',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-sm',
  lg: 'h-11 gap-2 rounded-lg px-5 text-[15px]',
};

/** Class string for anything that should look like a button (e.g. <a> or <Link>). */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return `inline-flex shrink-0 cursor-pointer select-none items-center justify-center font-medium whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading, icon, iconRight, className = '', disabled, children, type = 'button', ...props },
  ref,
) {
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {isLoading ? <Spinner size={iconSize} /> : icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && !isLoading && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
});

export default Button;
