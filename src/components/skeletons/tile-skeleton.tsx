import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface TileDetailRowSkeleton {
  /** Width of the main text bar. */
  width: string;
  /** Width of a pill on the right of the row (a badge, a site count). */
  pill?: string;
}

interface EntityTileSkeletonProps {
  /** The lines under the name: icon + text, and an optional pill on the right. */
  rows: TileDetailRowSkeleton[];
  /** Call / Text style buttons in the footer. */
  footerButtons?: number;
  className?: string;
}

/** Mirrors the Operator, Contact, Customer and Pump tile cards. */
export function EntityTileSkeleton({ rows, footerButtons = 2, className }: EntityTileSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden',
        className,
      )}
    >
      <div className="p-4 sm:p-4.5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex h-5 items-center">
                <Skeleton className="h-3.5 w-32 max-w-full rounded-md" />
              </div>
              <div className="mt-0.5 flex h-4 items-center">
                <Skeleton className="h-2.5 w-20 rounded-md" />
              </div>
            </div>
          </div>
          <Skeleton className="h-5.5 w-16 shrink-0 rounded-full" />
        </div>

        <div className="space-y-2 pt-1">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between gap-2 h-5">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
                <Skeleton className={cn('h-3 rounded-md', row.width)} />
              </div>
              {row.pill && <Skeleton className={cn('h-5 shrink-0 rounded-full', row.pill)} />}
            </div>
          ))}
        </div>
      </div>

      <TileFooterSkeleton buttons={footerButtons} />
    </div>
  );
}

/** The tinted bar at the bottom of a tile: small buttons on the left, a chevron on the right. */
function TileFooterSkeleton({ buttons }: { buttons: number }) {
  return (
    <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: buttons }, (_, index) => (
          <Skeleton key={index} className="h-7.5 w-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="ml-auto h-7.5 w-7.5 rounded-lg" />
    </div>
  );
}

/** Mirrors the Order tile: number and customer with a status pill, rig block with chips, footer. */
export function OrderTileSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col justify-between',
        className,
      )}
    >
      <div>
        <div className="p-3.5 pb-3 border-b border-slate-100 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="h-6 w-16 shrink-0 rounded-md" />
            <Skeleton className="h-3.5 w-32 max-w-full rounded-md" />
          </div>
          <Skeleton className="h-5.5 w-20 shrink-0 rounded-full" />
        </div>

        <div className="p-3.5 flex items-stretch gap-3">
          <Skeleton className="h-22 w-22 shrink-0 rounded-xl" />
          <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-full rounded-lg" />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 px-3.5 py-2.5 flex items-center justify-between">
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-3.5 w-20 rounded-md" />
      </div>
    </div>
  );
}
