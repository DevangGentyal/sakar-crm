'use client';

import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ isOpen, onClose, title, description, children, size = 'md' }, ref) => {
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeStyles: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    };

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
          onClick={onClose}
        />

        {/* Dialog — fixed height with scrollable content */}
        <div
          ref={ref}
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl ${sizeStyles[size]} w-full mx-4 animate-fade-in flex flex-col`}
          style={{ maxHeight: '85vh' }}
        >
          {/* Header — always visible */}
          {(title || description) && (
            <div className="flex items-start justify-between border-b border-slate-200 p-6 flex-shrink-0">
              <div className="flex-1">
                {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
                {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </>
    );
  }
);

Dialog.displayName = 'Dialog';
