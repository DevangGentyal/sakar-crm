import React, { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, circle = false, className = '', style = {}, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      width: width || '100%',
      height: height || '1rem',
      ...style,
    };

    return (
      <div
        ref={ref}
        className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse ${
          circle ? 'rounded-full' : 'rounded-lg'
        } ${className}`}
        style={baseStyle}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export const SkeletonTable = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        <Skeleton width={40} height={40} circle />
        <Skeleton width="100%" height={40} />
        <Skeleton width={80} height={40} />
      </div>
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="space-y-4">
    <Skeleton width="40%" height={24} />
    <div className="space-y-2">
      <Skeleton height={16} />
      <Skeleton height={16} width="90%" />
    </div>
  </div>
);
