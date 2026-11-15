import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { BreadcrumbSkeleton, DetailHeaderSkeleton } from '@/components/skeletons/detail-header-skeleton';
import { UnderlineTabsSkeleton } from '@/components/skeletons/tabs-skeleton';
import { SectionCardSkeleton } from '@/components/skeletons/section-card-skeleton';

export default function Loading() {
  return (
    <SkeletonPage label="Loading operator" className="space-y-5 sm:space-y-6 max-w-6xl">
      <BreadcrumbSkeleton />
      <DetailHeaderSkeleton titleWidth="w-56" badgeWidth="w-20" actions={['w-20', 'w-20', 'w-32']} />
      <UnderlineTabsSkeleton widths={['w-12', 'w-20']} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCardSkeleton roomy titleRule trailing="pill" titleWidth="w-44" rows={5} />
        <SectionCardSkeleton roomy titleRule trailing="icon" titleWidth="w-40" rows={3} />
      </div>
    </SkeletonPage>
  );
}
