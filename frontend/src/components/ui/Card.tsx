import React, { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', bordered = true, hoverable = false, children, ...props }, ref) => {
    const paddingStyles: Record<string, string> = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={`rounded-lg bg-white transition-all duration-200 ${
          bordered ? 'border border-slate-200' : ''
        } ${hoverable ? 'hover:shadow-md hover:border-slate-300' : 'shadow-sm'} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
