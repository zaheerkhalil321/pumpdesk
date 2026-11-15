import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SkeletonPageProps {
  /** Read out to screen readers while the page loads, e.g. "Loading orders". */
  label: string;
  /** Extra classes, e.g. a narrower max width or tighter gaps. */
  className?: string;
  /** Turn off the standard page padding for pages that draw their own bars edge to edge (Settings). */
  padded?: boolean;
  children: ReactNode;
}

/** The outer frame of every loading screen: the same padding as the real pages, plus the screen reader label. */
export function SkeletonPage({ label, className, padded = true, children }: SkeletonPageProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(padded && 'p-4 sm:p-6 lg:p-8 space-y-6 w-full', className)}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
