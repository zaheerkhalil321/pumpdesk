import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusTabsSkeletonProps {
  /** Width of each tab label, one entry per tab. */
  labelWidths: string[];
  /** Tabs with a number badge next to the label. */
  counts?: boolean;
  /** The "Showing 8 of 20" text on the right. */
  showing?: boolean;
  className?: string;
}

/** The grey segmented tab strip used for status filters (the first tab is the selected one). */
export function StatusTabsSkeleton({ labelWidths, counts = true, showing = true, className }: StatusTabsSkeletonProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60 w-full sm:w-fit overflow-hidden">
        {labelWidths.map((width, index) => (
          <div
            key={index}
            className={cn(
              'px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0',
              index === 0 && 'bg-white shadow-2xs',
            )}
          >
            <Skeleton className={cn('h-4 rounded-md', width)} />
            {counts && <Skeleton className="h-4 w-6 rounded-md" />}
          </div>
        ))}
      </div>
      {showing && <Skeleton className="hidden sm:block h-3.5 w-40 rounded-md" />}
    </div>
  );
}

interface PillTabsSkeletonProps {
  /** Width of each pill, one entry per pill. */
  widths: string[];
  /** Square corners (customers) instead of fully round pills. */
  squared?: boolean;
  /** A line under the tabs, as on the customer page. */
  underlined?: boolean;
  className?: string;
}

/** Separate pill buttons, the first one filled: Pumps, Contact and Customer pages. */
export function PillTabsSkeleton({ widths, squared = false, underlined = false, className }: PillTabsSkeletonProps) {
  return (
    <div className={cn('flex items-center gap-2', underlined && 'gap-1.5 border-b border-slate-200/80 pb-3', className)}>
      {widths.map((width, index) => (
        <Skeleton key={index} className={cn('h-7', squared ? 'rounded-lg' : 'rounded-full', width)} />
      ))}
    </div>
  );
}

interface UnderlineTabsSkeletonProps {
  widths: string[];
  className?: string;
}

/** Plain tabs with a line under the row (Operator page). */
export function UnderlineTabsSkeleton({ widths, className }: UnderlineTabsSkeletonProps) {
  return (
    <div className={cn('flex items-center gap-2 border-b border-slate-200/80 pt-1', className)}>
      {widths.map((width, index) => (
        <div key={index} className="px-4 py-2 flex items-center">
          <Skeleton className={cn('h-4 rounded-md', width)} />
        </div>
      ))}
    </div>
  );
}
