import React, { HTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'destructive';
  size?: 'sm' | 'md';
  children: ReactNode;
  fixedWidth?: boolean;
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'sm', fixedWidth = false, children, ...props }, ref) => {
    const variantStyles: Record<string, string> = {
      default: 'bg-slate-200 text-slate-800 border-slate-300',
      primary: 'bg-blue-100 text-blue-800 border-blue-300',
      secondary: 'bg-purple-100 text-purple-800 border-purple-300',
      success: 'bg-green-100 text-green-800 border-green-300',
      warning: 'bg-amber-100 text-amber-800 border-amber-300',
      danger: 'bg-red-100 text-red-800 border-red-300',
      destructive: 'bg-red-100 text-red-800 border-red-300',
    };

    const sizeStyles: Record<string, string> = {
      sm: 'px-2 py-1 text-xs font-medium',
      md: 'px-3 py-1.5 text-sm font-medium',
    };

    const widthClass = fixedWidth ? 'w-24 text-center' : '';

    return (
      <div
        ref={ref}
        className={`inline-block border rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${widthClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
