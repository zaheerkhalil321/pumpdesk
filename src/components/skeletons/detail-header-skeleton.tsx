import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** "< Back to customers", optionally with a second link on the right (Order page). */
export function BackLinkSkeleton({
  width = 'w-32',
  trailingWidth,
  className,
}: {
  width?: string;
  trailingWidth?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex h-5 items-center justify-between', className)}>
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3.5 w-3.5 rounded-full" />
        <Skeleton className={cn('h-3 rounded-md', width)} />
      </div>
      {trailingWidth && (
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className={cn('h-3 rounded-md', trailingWidth)} />
        </div>
      )}
    </div>
  );
}

/** "Operators > Name" trail. */
export function BreadcrumbSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-4 items-center gap-1.5', className)}>
      <Skeleton className="h-3 w-16 rounded-md" />
      <Skeleton className="h-3.5 w-3.5 rounded-full" />
      <Skeleton className="h-3 w-28 rounded-md" />
    </div>
  );
}

type DetailTitleSize = 'lg' | 'xl';

interface DetailHeaderSkeletonProps {
  /** "lg" is the 2xl / 3xl title (Operator, Contact, Order), "xl" the smaller one (Customer). */
  titleSize?: DetailTitleSize;
  titleWidth?: string;
  /** Width of the status pill next to the title. Leave out for none. */
  badgeWidth?: string;
  /** Width of the grey line under the title. Leave out for none. */
  subtitleWidth?: string;
  /** Width of each action button on the right. */
  actions?: string[];
  /** Keep the buttons on the right of the title on phones too (Customer page). */
  inlineActions?: boolean;
  /** A line under the header (Contact page). */
  bordered?: boolean;
  className?: string;
}

/** Title with a status pill, a subtitle, and the action buttons on the right. */
export function DetailHeaderSkeleton({
  titleSize = 'lg',
  titleWidth = 'w-56',
  badgeWidth = 'w-16',
  subtitleWidth,
  actions = [],
  inlineActions = false,
  bordered = false,
  className,
}: DetailHeaderSkeletonProps) {
  const isLarge = titleSize === 'lg';
  return (
    <div
      className={cn(
        inlineActions
          ? 'flex items-start sm:items-center justify-between gap-3 sm:gap-4'
          : 'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
        bordered && 'pb-2 border-b border-slate-100',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={cn('flex items-center', isLarge ? 'h-8 sm:h-9' : 'h-7 sm:h-8')}>
            <Skeleton className={cn('rounded-md', isLarge ? 'h-6 sm:h-7' : 'h-5 sm:h-6', titleWidth)} />
          </div>
          {badgeWidth && <Skeleton className={cn('h-6 rounded-full', badgeWidth)} />}
        </div>
        {subtitleWidth && (
          <div className="flex h-4 sm:h-5 items-center">
            <Skeleton className={cn('h-3 sm:h-3.5 rounded-md', subtitleWidth)} />
          </div>
        )}
      </div>
      {actions.length > 0 && (
        <div className={cn('flex items-center gap-2 flex-wrap', inlineActions && 'shrink-0 justify-end')}>
          {actions.map((width, index) => (
            <Skeleton key={index} className={cn('h-9 rounded-lg', width)} />
          ))}
        </div>
      )}
    </div>
  );
}
