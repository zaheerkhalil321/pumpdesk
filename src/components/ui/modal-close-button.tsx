'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalCloseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable prominent circular close cross button with border and shadow for all modals & sheets.
 */
export const ModalCloseButton = React.forwardRef<
  HTMLButtonElement,
  ModalCloseButtonProps
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-9 w-9 text-base',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-4.5 w-4.5',
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label="Close"
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-white text-slate-500 hover:text-slate-800 border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md hover:bg-slate-50 active:scale-95 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:border-slate-400 shrink-0',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <X className={cn(iconSizes[size], 'stroke-[2.25]')} />
      <span className="sr-only">Close</span>
    </button>
  );
});

ModalCloseButton.displayName = 'ModalCloseButton';
