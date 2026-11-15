import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PageHeaderSkeletonProps {
  titleWidth?: string;
  descriptionWidth?: string;
  /** Width of the primary button on the right. Leave out for pages without one. */
  actionWidth?: string;
  className?: string;
}

/** Mirrors PageHeader: title, one line of subtitle, primary button on the right. */
export function PageHeaderSkeleton({
  titleWidth = 'w-32',
  descriptionWidth = 'w-72 max-w-full',
  actionWidth,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <div className={cn('flex items-start sm:items-center justify-between gap-3 sm:gap-4 pb-1', className)}>
      <div className="min-w-0 flex-1">
        <div className="flex h-7 sm:h-8 items-center">
          <Skeleton className={cn('h-5 sm:h-6 rounded-md', titleWidth)} />
        </div>
        <div className="mt-0.5 flex h-4 sm:h-5 items-center">
          <Skeleton className={cn('h-3 sm:h-3.5 rounded-md', descriptionWidth)} />
        </div>
      </div>
      {actionWidth && (
        <div className="shrink-0 self-start sm:self-center">
          <Skeleton className={cn('h-9 rounded-lg', actionWidth)} />
        </div>
      )}
    </div>
  );
}
