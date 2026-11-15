import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { ToolbarSkeleton } from '@/components/skeletons/toolbar-skeleton';
import { StatusTabsSkeleton } from '@/components/skeletons/tabs-skeleton';
import { ListBodySkeleton } from '@/components/skeletons/list-body-skeleton';
import { EntityTileSkeleton } from '@/components/skeletons/tile-skeleton';
import type { TableColumnSkeleton } from '@/components/skeletons/table-skeleton';

const COLUMNS: TableColumnSkeleton[] = [
  { cell: 'avatarTwoLine', header: 'w-16', className: 'px-4 sm:px-6 w-[24%]', widths: ['w-28', 'w-20'] },
  { cell: 'text', header: 'w-28', className: 'w-[20%]', widths: ['w-28'] },
  { cell: 'pill', header: 'w-10', className: 'w-[14%]', widths: ['w-20'] },
  { cell: 'twoLine', header: 'w-24', className: 'w-[20%]', widths: ['w-28', 'w-36'] },
  { cell: 'pill', header: 'w-12', className: 'w-[10%]', widths: ['w-16'] },
  { cell: 'actions', header: 'w-14', className: 'w-[12%] sm:pr-6' },
];

export default function Loading() {
  return (
    <SkeletonPage label="Loading contacts">
      <PageHeaderSkeleton titleWidth="w-28" descriptionWidth="w-72" actionWidth="w-36" />
      <div className="space-y-3">
        <StatusTabsSkeleton labelWidths={['w-20', 'w-12', 'w-14']} />
        <ToolbarSkeleton
          selects={['w-36 sm:w-44 shrink-0', 'w-32 sm:w-36 shrink-0']}
          trailingSelect="w-36 sm:w-40 shrink-0"
        />
      </div>
      <ListBodySkeleton
        columns={COLUMNS}
        tile={
          <EntityTileSkeleton
            rows={[{ width: 'w-28', pill: 'w-16' }, { width: 'w-32' }, { width: 'w-40' }]}
          />
        }
      />
    </SkeletonPage>
  );
}
