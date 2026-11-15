import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { BackLinkSkeleton, DetailHeaderSkeleton } from '@/components/skeletons/detail-header-skeleton';
import { PillTabsSkeleton } from '@/components/skeletons/tabs-skeleton';
import {
  ListCardSkeleton,
  NoteBoxSkeleton,
  SectionCardSkeleton,
} from '@/components/skeletons/section-card-skeleton';

export default function Loading() {
  return (
    <SkeletonPage label="Loading customer">
      <div className="space-y-3">
        <BackLinkSkeleton width="w-28" />
        <DetailHeaderSkeleton
          inlineActions
          titleSize="xl"
          titleWidth="w-56"
          badgeWidth="w-20"
          subtitleWidth="w-64"
          actions={['w-14 sm:w-32', 'w-28']}
        />
      </div>
      <PillTabsSkeleton squared underlined widths={['w-24', 'w-36']} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <SectionCardSkeleton titleWidth="w-44" rows={4} rowPadding="py-2.5" />
          <SectionCardSkeleton titleWidth="w-36" rows={0}>
            <NoteBoxSkeleton lines={2} />
          </SectionCardSkeleton>
        </div>
        <div className="space-y-5">
          <SectionCardSkeleton titleWidth="w-56" rows={0}>
            <NoteBoxSkeleton lines={2} />
            <NoteBoxSkeleton lines={1} />
          </SectionCardSkeleton>
          <ListCardSkeleton titleWidth="w-36" items={3} />
        </div>
      </div>
    </SkeletonPage>
  );
}
