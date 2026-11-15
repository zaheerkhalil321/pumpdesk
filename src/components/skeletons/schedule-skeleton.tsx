import { Skeleton } from '@/components/ui/skeleton';
import { DateStripSkeleton } from './date-strip-skeleton';
import { ScheduleCardsSkeleton } from './schedule-cards-skeleton';
import { ScheduleTimelineSkeleton } from './schedule-timeline-skeleton';
import { SearchBoxSkeleton } from './toolbar-skeleton';

/** Title, subtitle, the open day (wide screens) and the New booking button. */
function ScheduleHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-4 sm:items-center min-[1400px]:grid min-[1400px]:grid-cols-[auto_1fr_auto] min-[1400px]:gap-6">
      <div className="min-w-0">
        <div className="flex h-7 sm:h-8 items-center">
          <Skeleton className="h-5 sm:h-6 w-28 rounded-md" />
        </div>
        <div className="mt-0.5 flex h-4 sm:h-5 items-center">
          <Skeleton className="h-3 sm:h-3.5 w-44 rounded-md" />
        </div>
      </div>
      <DateStripSkeleton className="hidden min-[1400px]:flex min-[1400px]:justify-self-center" />
      <Skeleton className="hidden sm:block h-9 w-36 justify-self-end rounded-lg" />
    </div>
  );
}

/** Phones: day stepper, Cards / Grid switch, Filter, the week row and the count chips. */
function MobileToolbarSkeleton() {
  return (
    <div className="md:hidden flex flex-col gap-2 pt-1 pb-1">
      <div className="flex items-center justify-between gap-1.5">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-8 w-18 rounded-xl" />
        </div>
      </div>
      <DateStripSkeleton className="w-full" />
      <div className="flex items-center gap-1.5 py-0.5">
        <Skeleton className="h-6.5 w-16 rounded-lg" />
        <Skeleton className="h-6.5 w-24 rounded-lg" />
        <Skeleton className="h-6.5 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/** Tablets and desktops: week row, booking count, then search, Day / Week / List and the two filters. */
function DesktopToolbarSkeleton() {
  return (
    <div className="hidden md:flex flex-col gap-3 pt-3 pb-2">
      <DateStripSkeleton className="self-start min-[1400px]:hidden" />
      <div className="flex h-5 items-center gap-2 pl-0.5">
        <Skeleton className="h-3 w-36 rounded-md" />
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-3">
        <SearchBoxSkeleton className="flex-1 min-w-[220px]" />
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 shadow-2xs">
            <Skeleton className="h-7 w-12 rounded-md" />
            <Skeleton className="h-7 w-14 rounded-md" />
            <Skeleton className="h-7 w-12 rounded-md" />
          </div>
          <Skeleton className="h-8 w-36 sm:w-44 rounded-md" />
          <Skeleton className="h-8 w-36 sm:w-40 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** The whole Schedule page: header, date strip and toolbar, then pump lanes (tablet and up) or pump cards (phone). */
export function ScheduleSkeleton() {
  return (
    <>
      <ScheduleHeaderSkeleton />
      <MobileToolbarSkeleton />
      <DesktopToolbarSkeleton />
      <div className="md:hidden">
        <ScheduleCardsSkeleton />
      </div>
      <div className="hidden md:block">
        <ScheduleTimelineSkeleton />
      </div>
      <div className="hidden md:flex items-center gap-1.5 pt-2">
        <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
        <Skeleton className="h-3 w-72 rounded-md" />
      </div>
    </>
  );
}
