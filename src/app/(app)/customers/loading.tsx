import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { ToolbarSkeleton } from '@/components/skeletons/toolbar-skeleton';
import { StatusTabsSkeleton } from '@/components/skeletons/tabs-skeleton';
import { ListBodySkeleton } from '@/components/skeletons/list-body-skeleton';
import { EntityTileSkeleton } from '@/components/skeletons/tile-skeleton';
import type { TableColumnSkeleton } from '@/components/skeletons/table-skeleton';

const COLUMNS: TableColumnSkeleton[] = [
  { cell: 'avatarTwoLine', header: 'w-20', className: 'px-4 sm:px-6 w-[28%]', widths: ['w-32', 'w-16'] },
  { cell: 'text', header: 'w-12', className: 'w-[16%]', widths: ['w-28'] },
  { cell: 'text', header: 'w-12', className: 'w-[20%]', widths: ['w-36'] },
  { cell: 'text', header: 'w-14', className: 'w-[14%]', widths: ['w-20'] },
  { cell: 'pill', header: 'w-12', className: 'w-[10%]', widths: ['w-16'] },
  { cell: 'actions', header: 'w-14', className: 'w-[12%] sm:pr-6' },
];

export default function Loading() {
  return (
    <SkeletonPage label="Loading customers">
      <PageHeaderSkeleton titleWidth="w-32" descriptionWidth="w-72" actionWidth="w-36" />
      <div className="space-y-3">
        <StatusTabsSkeleton labelWidths={['w-24', 'w-12', 'w-14']} />
        <ToolbarSkeleton />
      </div>
      <ListBodySkeleton
        columns={COLUMNS}
        tile={
          <EntityTileSkeleton
            rows={[{ width: 'w-36' }, { width: 'w-28', pill: 'w-14' }, { width: 'w-40' }]}
          />
        }
      />
    </SkeletonPage>
  );
}
