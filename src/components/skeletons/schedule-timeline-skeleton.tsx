import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LaneBooking {
  /** Tailwind grid placement inside the 12 hour columns. */
  placement: string;
}

// Tailwind needs the full class names in the source, so each placement is spelled out.
const LANES: LaneBooking[][] = [
  [{ placement: 'col-start-3 col-span-4' }, { placement: 'col-start-8 col-span-3' }],
  [{ placement: 'col-start-2 col-span-3' }, { placement: 'col-start-6 col-span-5' }],
  [{ placement: 'col-start-4 col-span-6' }],
  [{ placement: 'col-start-2 col-span-4' }, { placement: 'col-start-9 col-span-3' }],
  [{ placement: 'col-start-5 col-span-3' }],
];

const HOURS = Array.from({ length: 12 }, (_, index) => index);

/** Mirrors the day board: frozen pump column, hour header, and pump lanes with booking cards. */
export function ScheduleTimelineSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs', className)}>
      <div className="flex border-b border-slate-200 bg-slate-50/80">
        <div className="w-[110px] sm:w-[180px] shrink-0 px-2.5 sm:px-3 py-2.5 border-r border-slate-200 bg-slate-50 flex items-center">
          <Skeleton className="h-3.5 w-12 rounded-md" />
        </div>
        <div className="flex-1 grid grid-cols-12">
          {HOURS.map((hour) => (
            <div key={hour} className="py-2.5 flex justify-center border-r border-slate-200/80 last:border-r-0">
              <Skeleton className="h-3.5 w-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-200/80">
        {LANES.map((bookings, lane) => (
          <div key={lane} className="flex min-h-24">
            <div className="w-[110px] sm:w-[180px] shrink-0 px-2 sm:px-3 py-3 border-r border-slate-200 bg-white flex items-center gap-1.5 sm:gap-2.5">
              <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-12 rounded-md" />
                <Skeleton className="mt-1.5 hidden sm:block h-2.5 w-24 rounded-md" />
              </div>
            </div>

            <div className="relative flex-1">
              <div className="grid h-full grid-cols-12">
                {HOURS.map((hour) => (
                  <div key={hour} className="border-r border-slate-100 last:border-r-0" />
                ))}
              </div>
              <div className="absolute inset-0 grid grid-cols-12 p-1.5">
                {bookings.map((booking) => (
                  <div
                    key={booking.placement}
                    className={cn(
                      'min-w-0 rounded-lg border border-slate-200 bg-white p-2 shadow-2xs space-y-1.5',
                      booking.placement,
                    )}
                  >
                    <Skeleton className="h-3 w-2/3 rounded-md" />
                    <Skeleton className="h-2.5 w-1/2 rounded-md" />
                    <Skeleton className="h-2.5 w-3/4 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
