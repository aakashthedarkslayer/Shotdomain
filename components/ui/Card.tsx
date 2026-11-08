import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, header, footer, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs dark:border-stone-800 dark:bg-stone-900/90 transition-colors ${className}`}
        {...props}
      >
        {header && <div className="border-b border-stone-100 pb-5 mb-6 dark:border-stone-800">{header}</div>}
        <div>{children}</div>
        {footer && <div className="border-t border-stone-100 pt-5 mt-6 dark:border-stone-800">{footer}</div>}
      </div>
    );
  },
);

Card.displayName = 'Card';
export default Card;
