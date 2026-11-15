import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { ToolbarSkeleton } from '@/components/skeletons/toolbar-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/** The fallback for any page without its own loading screen: a neutral page frame. */
export default function AppLoading() {
  return (
    <SkeletonPage label="Loading">
      <PageHeaderSkeleton actionWidth="w-32" />
      <ToolbarSkeleton viewToggle={false} />
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs p-4 sm:p-6 space-y-4">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-5/6 rounded-md" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
      </div>
    </SkeletonPage>
  );
}
