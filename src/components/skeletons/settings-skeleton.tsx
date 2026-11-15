import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TAB_WIDTHS = ['w-14', 'w-14', 'w-24', 'w-24', 'w-24', 'w-20'];
const HUB_CARD_COUNT = 5;

/** The white bar on top: breadcrumbs, Log out, and the row of settings tabs. */
function SettingsBarSkeleton() {
  return (
    <div className="w-full bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex h-8 items-center gap-1.5">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
        <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
      </div>
      <div className="px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 overflow-hidden">
        <nav className="flex space-x-1 sm:space-x-2 py-1 min-w-max">
          {TAB_WIDTHS.map((width, index) => (
            <div key={index} className="px-3.5 py-2.5 flex items-center">
              <Skeleton className={cn('h-4 rounded-md', width)} />
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

/** One category card on the Overview tab: icon box, title, one line of text, arrow. */
function SettingsHubCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-start gap-4 min-w-0">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 space-y-2 pt-0.5">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-44 max-w-full rounded-md" />
        </div>
      </div>
      <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
    </div>
  );
}

/** The Settings page on its Overview tab: top bar, search, category cards, appearance card. */
export function SettingsSkeleton() {
  return (
    <>
      <SettingsBarSkeleton />
      <div className="flex-1 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="h-11 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-2.5 px-3.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: HUB_CARD_COUNT }, (_, index) => (
              <SettingsHubCardSkeleton key={index} />
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-64 max-w-full rounded-md" />
            <div className="flex items-center gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-10 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
