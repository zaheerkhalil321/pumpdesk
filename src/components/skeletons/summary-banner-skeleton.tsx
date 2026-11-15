import { Skeleton } from '@/components/ui/skeleton';

/** The two-sided white banner on the Pumps page: "pumps in maintenance" and "inspections due soon". */
export function SummaryBannerSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-3 sm:gap-0">
      <div className="flex items-center justify-between sm:pr-6">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-4 shrink-0 rounded-md" />
          <Skeleton className="h-3.5 w-36 rounded-md" />
        </div>
        <Skeleton className="h-3 w-28 rounded-md" />
      </div>
      <div className="flex items-center justify-between sm:pl-6 pt-3 sm:pt-0">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-4 shrink-0 rounded-md" />
          <Skeleton className="h-3.5 w-40 rounded-md" />
        </div>
        <Skeleton className="h-3 w-28 rounded-md" />
      </div>
    </div>
  );
}
