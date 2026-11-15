import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** Where the search box stops sitting above the filters and moves to the left of them. */
type ToolbarStack = 'sm' | 'lg';

// Tailwind needs the full class names in the source, so each breakpoint is spelled out.
const BAR_CLASSES: Record<ToolbarStack, string> = {
  sm: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3',
  lg: 'flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 sm:gap-3',
};
const CONTROLS_CLASSES: Record<ToolbarStack, string> = {
  sm: 'flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 flex-wrap',
  lg: 'flex items-center gap-2 w-full lg:w-auto sm:justify-end sm:shrink-0 sm:flex-wrap',
};

interface ToolbarSkeletonProps {
  stack?: ToolbarStack;
  /** One entry per filter select: the classes that size its wrapper, e.g. "w-36 sm:w-44 shrink-0". */
  selects?: string[];
  /** The Tiles / Table switch. */
  viewToggle?: boolean;
  /** A select that sits after the switch, such as Sort. */
  trailingSelect?: string;
  className?: string;
}

/** The white search bar card: search box, filter selects, and the Tiles / Table switch. */
export function ToolbarSkeleton({
  stack = 'sm',
  selects = [],
  viewToggle = true,
  trailingSelect,
  className,
}: ToolbarSkeletonProps) {
  const hasControls = selects.length > 0 || viewToggle || Boolean(trailingSelect);
  return (
    <div
      className={cn(
        'bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs',
        BAR_CLASSES[stack],
        className,
      )}
    >
      <SearchBoxSkeleton className="flex-1" />
      {hasControls && (
        <div className={CONTROLS_CLASSES[stack]}>
          {selects.map((classes, index) => (
            <div key={index} className={classes}>
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
          {viewToggle && <ViewToggleSkeleton />}
          {trailingSelect && (
            <div className={trailingSelect}>
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** An empty search field: magnifier and placeholder text. */
export function SearchBoxSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-10 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-2.5 px-3.5',
        className,
      )}
    >
      <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
      <Skeleton className="h-3 w-40 max-w-[60%] rounded-md" />
    </div>
  );
}

/** The small Tiles / Table switch. Labels show from sm up, like the real one. */
export function ViewToggleSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs shrink-0',
        className,
      )}
    >
      <Skeleton className="h-7 w-8 sm:w-18 rounded-md" />
      <Skeleton className="h-7 w-8 sm:w-18 rounded-md" />
    </div>
  );
}
