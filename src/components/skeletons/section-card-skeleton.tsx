import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** Value widths that repeat down a card, so the rows do not all end at the same place. */
const VALUE_WIDTHS = ['w-32', 'w-40', 'w-24', 'w-36', 'w-28', 'w-20'];
const LABEL_WIDTHS = ['w-14', 'w-20', 'w-16', 'w-24', 'w-12'];

interface SectionCardSkeletonProps {
  titleWidth?: string;
  /** What sits on the right of the title: a small pill or an icon. */
  trailing?: 'pill' | 'icon';
  /** Rows of "label ... value". */
  rows?: number;
  /** Extra room (the Operator page cards) or the tighter card used on Customer and Contact. */
  roomy?: boolean;
  /** Vertical padding of each row; the Contact and Order cards use a tighter one. */
  rowPadding?: string;
  /** Rule under the title, as on the Operator page. */
  titleRule?: boolean;
  /** Anything to show under the rows: note boxes, buttons. */
  children?: ReactNode;
  className?: string;
}

/** A white section card: title, then label and value rows separated by thin lines. */
export function SectionCardSkeleton({
  titleWidth = 'w-36',
  trailing,
  rows = 5,
  roomy = false,
  rowPadding = 'py-3',
  titleRule = false,
  children,
  className,
}: SectionCardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4',
        roomy ? 'p-5 sm:p-6' : 'p-5',
        className,
      )}
    >
      <div className={cn('flex items-center justify-between', titleRule && 'border-b border-slate-100 pb-3')}>
        <div className="flex h-5 items-center">
          <Skeleton className={cn('h-4 rounded-md', titleWidth)} />
        </div>
        {trailing === 'pill' && <Skeleton className="h-5 w-16 rounded-full" />}
        {trailing === 'icon' && <Skeleton className="h-4 w-4 rounded-md" />}
      </div>
      {rows > 0 && (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className={cn('flex items-center justify-between gap-4', rowPadding)}>
              <Skeleton className={cn('h-3 rounded-md', LABEL_WIDTHS[index % LABEL_WIDTHS.length])} />
              <Skeleton className={cn('h-3.5 rounded-md', VALUE_WIDTHS[index % VALUE_WIDTHS.length])} />
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

/** The tinted note box inside a card: a short title and a couple of lines of text. */
export function NoteBoxSkeleton({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2', className)}>
      <Skeleton className="h-2.5 w-24 rounded-md" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-3 rounded-md', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/** A card that holds a few list items, each with a name line and a small line under it. */
export function ListCardSkeleton({
  titleWidth = 'w-40',
  items = 3,
  className,
}: {
  titleWidth?: string;
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex h-5 items-center">
          <Skeleton className={cn('h-4 rounded-md', titleWidth)} />
        </div>
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: items }, (_, index) => (
          <div key={index} className="py-3 flex items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <Skeleton className="h-2.5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
