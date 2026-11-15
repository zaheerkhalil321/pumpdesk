import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { BackLinkSkeleton, DetailHeaderSkeleton } from '@/components/skeletons/detail-header-skeleton';
import { PillTabsSkeleton } from '@/components/skeletons/tabs-skeleton';
import { ListCardSkeleton, SectionCardSkeleton } from '@/components/skeletons/section-card-skeleton';

export default function Loading() {
  return (
    <SkeletonPage label="Loading contact" className="max-w-[1600px] mx-auto">
      <BackLinkSkeleton width="w-32" />
      <DetailHeaderSkeleton
        bordered
        titleWidth="w-60"
        badgeWidth="w-20"
        subtitleWidth="w-56"
        actions={['w-20', 'w-20', 'w-24', 'w-9']}
      />
      <PillTabsSkeleton widths={['w-24', 'w-32']} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        <div className="space-y-5">
          <SectionCardSkeleton titleWidth="w-40" rows={6} rowPadding="py-2.5" />
          <ListCardSkeleton titleWidth="w-44" items={2} />
          <ListCardSkeleton titleWidth="w-32" items={2} />
        </div>
        <div className="space-y-5">
          <SectionCardSkeleton titleWidth="w-48" rows={3} rowPadding="py-2.5" />
        </div>
      </div>
    </SkeletonPage>
  );
}
