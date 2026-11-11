import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`glass rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, actions, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardFooter({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
