import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** A summary card: round icon, small label, large value. Mirrors the metric cards on the Order page. */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3',
        className,
      )}
    >
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-2.5 w-16 rounded-md" />
        <Skeleton className="h-4.5 w-20 rounded-md" />
      </div>
    </div>
  );
}

/** A summary card with a label, a big number and a hint line underneath (Billing). */
export function StatBlockSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-lg border border-border bg-card', className)}>
      <Skeleton className="h-3 w-36 rounded-md" />
      <Skeleton className="mt-2 h-6 w-28 rounded-md" />
      <Skeleton className="mt-1.5 h-2.5 w-40 max-w-full rounded-md" />
    </div>
  );
}

/** A row of summary cards. Two across on a phone, four on a wide screen. */
export function StatCardRowSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
      {Array.from({ length: count }, (_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  );
}
