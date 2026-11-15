import { Skeleton } from '@/components/ui/skeleton';
import { SearchBoxSkeleton, ToolbarSkeleton, ViewToggleSkeleton } from './toolbar-skeleton';
import { StatusTabsSkeleton } from './tabs-skeleton';

const STATUS_TAB_WIDTHS = ['w-16', 'w-14', 'w-28', 'w-16', 'w-16', 'w-14', 'w-28'];

/**
 * The Orders page controls. From sm up: status tabs and the search bar.
 * On a phone: a full-width search box, then Filter, the view switch and sort.
 */
export function OrdersControlsSkeleton() {
  return (
    <div>
      <div className="sm:hidden space-y-2.5">
        <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs">
          <SearchBoxSkeleton />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <div className="flex items-center gap-2">
            <ViewToggleSkeleton />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      </div>

      <div className="hidden sm:block space-y-3">
        <StatusTabsSkeleton labelWidths={STATUS_TAB_WIDTHS} />
        <ToolbarSkeleton selects={[]} trailingSelect="w-36 sm:w-44 shrink-0" />
      </div>
    </div>
  );
}
