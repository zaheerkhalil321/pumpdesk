import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { BackLinkSkeleton, DetailHeaderSkeleton } from '@/components/skeletons/detail-header-skeleton';
import { StatCardRowSkeleton } from '@/components/skeletons/stat-card-skeleton';
import { NoteBoxSkeleton, SectionCardSkeleton } from '@/components/skeletons/section-card-skeleton';

export default function Loading() {
  return (
    <SkeletonPage label="Loading order" className="space-y-5">
      <BackLinkSkeleton width="w-28" trailingWidth="w-28" />
      <DetailHeaderSkeleton
        titleWidth="w-72 max-w-full"
        badgeWidth="w-24"
        subtitleWidth="w-64"
        actions={['w-32', 'w-28']}
      />
      <StatCardRowSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCardSkeleton titleWidth="w-24" rows={8} rowPadding="py-2.5">
          <NoteBoxSkeleton lines={2} />
          <NoteBoxSkeleton lines={1} />
        </SectionCardSkeleton>
        <div className="space-y-5">
          <SectionCardSkeleton titleWidth="w-32" rows={2} rowPadding="py-2.5">
            <NoteBoxSkeleton lines={1} className="h-16" />
          </SectionCardSkeleton>
          <SectionCardSkeleton titleWidth="w-16" rows={4} rowPadding="py-2.5" />
        </div>
      </div>
    </SkeletonPage>
  );
}
