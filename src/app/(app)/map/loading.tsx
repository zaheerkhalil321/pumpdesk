import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <SkeletonPage label="Loading map" className="space-y-5">
      <PageHeaderSkeleton titleWidth="w-16" descriptionWidth="w-56" />
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <Skeleton className="h-[calc(100dvh-16rem)] min-h-[360px] w-full rounded-none" />
      </div>
    </SkeletonPage>
  );
}
