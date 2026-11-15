import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { PillTabsSkeleton } from '@/components/skeletons/tabs-skeleton';
import { SummaryBannerSkeleton } from '@/components/skeletons/summary-banner-skeleton';
import { ToolbarSkeleton } from '@/components/skeletons/toolbar-skeleton';
import { ListBodySkeleton } from '@/components/skeletons/list-body-skeleton';
import { EntityTileSkeleton } from '@/components/skeletons/tile-skeleton';
import type { TableColumnSkeleton } from '@/components/skeletons/table-skeleton';

const COLUMNS: TableColumnSkeleton[] = [
  { cell: 'check', className: 'w-10' },
  { cell: 'twoLine', header: 'w-12', className: 'w-[19%]', widths: ['w-24', 'w-16'] },
  { cell: 'text', header: 'w-20', className: 'w-[17%]', widths: ['w-28'] },
  { cell: 'text', header: 'w-24', className: 'w-[12%]', widths: ['w-14'] },
  { cell: 'twoLine', header: 'w-28', className: 'w-[17%]', widths: ['w-24', 'w-12'] },
  { cell: 'pill', header: 'w-12', className: 'w-[21%]', widths: ['w-28'] },
  { cell: 'text', header: 'w-24', className: 'w-[14%]', widths: ['w-20'] },
  { cell: 'chevron', className: 'pr-6 w-10' },
];

export default function Loading() {
  return (
    <SkeletonPage label="Loading pumps">
      <PageHeaderSkeleton titleWidth="w-20" descriptionWidth="w-80" actionWidth="w-32" />
      <PillTabsSkeleton widths={['w-24', 'w-28', 'w-26']} />
      <SummaryBannerSkeleton />
      <ToolbarSkeleton
        stack="lg"
        selects={['flex-1 min-w-0 lg:flex-none lg:w-44', 'flex-1 min-w-0 lg:flex-none lg:w-40']}
      />
      <ListBodySkeleton
        columns={COLUMNS}
        tile={
          <EntityTileSkeleton
            rows={[
              { width: 'w-28', pill: 'w-16' },
              { width: 'w-32' },
              { width: 'w-36' },
              { width: 'w-28' },
            ]}
            footerButtons={1}
          />
        }
      />
    </SkeletonPage>
  );
}
