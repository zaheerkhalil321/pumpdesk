'use client';

import type { ReactNode } from 'react';
import * as m from 'motion/react-m';

import { cn } from '@/lib/utils';

interface ActivePillProps {
  /** Shared by every option in one group, so the pill slides from the old choice to the new one. */
  layoutId: string;
  /** The pill's own look; white with a soft shadow by default. */
  className?: string;
  /** Marks that travel with the pill, such as a nav item's side bar. */
  children?: ReactNode;
}

/**
 * The highlight behind the selected tab, toggle or nav item. Render it inside the selected
 * option only; the option needs `relative isolate` so the pill sits behind its text.
 */
export function ActivePill({ layoutId, className, children }: ActivePillProps) {
  return (
    <m.span
      layoutId={layoutId}
      aria-hidden
      transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
      className={cn('absolute inset-0 -z-10 rounded-[inherit] bg-white shadow-2xs', className)}
    >
      {children}
    </m.span>
  );
}
