import { Skeleton } from '@/components/ui/skeleton';

const RIG_COUNT = 3;

/** Mirrors the phone view of the schedule: one card per pump with its booking cards inside. */
export function ScheduleCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 pb-20">
      {Array.from({ length: RIG_COUNT }, (_, rig) => (
        <div key={rig} className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
              <div className="min-w-0">
                <Skeleton className="h-4.5 w-16 rounded-md" />
                <Skeleton className="mt-1.5 h-3 w-28 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          </div>

          <div className="p-3.5 flex items-stretch gap-3 overflow-hidden">
            <div className="w-[84%] sm:w-[320px] shrink-0 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-36 rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                  <Skeleton className="h-3 w-40 max-w-full rounded-md" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
            <div className="w-[84%] sm:w-[320px] shrink-0 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
