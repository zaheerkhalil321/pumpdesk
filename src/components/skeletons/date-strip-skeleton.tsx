import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors the week row on the Schedule page: Today, month, arrows, seven days, calendar button. */
export function DateStripSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs',
        className,
      )}
    >
      <Skeleton className="hidden sm:block h-9 w-16 rounded-xl" />
      <div className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />
      <div className="hidden w-28 shrink-0 justify-center sm:flex">
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>
      <Skeleton className="mr-1 hidden sm:block h-7 w-7 shrink-0 rounded-full" />
      <div className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:w-[24rem] sm:flex-none">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex h-15 min-w-0 flex-col items-center justify-center gap-1.5 sm:min-w-[3.25rem]">
            <Skeleton className="h-2.5 w-6 rounded-md" />
            <Skeleton className="h-3.5 w-4 rounded-md" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="ml-1 hidden sm:block h-7 w-7 shrink-0 rounded-full" />
      <div className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />
      <Skeleton className="hidden sm:block h-9 w-9 shrink-0 rounded-xl" />
    </div>
  );
}
