import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, Spinner } from './Icon';
import type { IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
/**
 * DESIGN.md (Contact sheet): one 6 px control radius everywhere. "pill" is
 * kept as the marketing call: the same shape, set a step heavier.
 */
export type ButtonShape = 'rect' | 'pill';

const VARIANTS: Record<ButtonVariant, string> = {
  // Ink is the conversion colour: one black (white in dark mode) primary per view.
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
  secondary: 'border border-line-strong bg-surface text-fg hover:border-fg',
  ghost: 'text-muted hover:bg-subtle hover:text-fg',
  danger: 'border border-line-strong bg-surface text-danger hover:border-danger hover:bg-danger-soft',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
};

const SHAPES: Record<ButtonShape, string> = {
  rect: 'rounded-md',
  pill: 'rounded-md font-semibold',
};

/** Class string for anything that should look like a button (e.g. <a> or <Link>). */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '', shape: ButtonShape = 'rect') {
  return `inline-flex shrink-0 cursor-pointer select-none items-center justify-center font-semibold whitespace-nowrap transition-colors active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${SHAPES[shape]} ${extra}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  isLoading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', shape = 'rect', isLoading, icon, iconRight, className = '', disabled, children, type = 'button', ...props },
  ref,
) {
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={buttonClass(variant, size, className, shape)}
      {...props}
    >
      {isLoading ? <Spinner size={iconSize} /> : icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && !isLoading && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
});

export default Button;
