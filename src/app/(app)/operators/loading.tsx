import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { ToolbarSkeleton } from '@/components/skeletons/toolbar-skeleton';
import { ListBodySkeleton } from '@/components/skeletons/list-body-skeleton';
import { EntityTileSkeleton } from '@/components/skeletons/tile-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import type { TableColumnSkeleton } from '@/components/skeletons/table-skeleton';

const COLUMNS: TableColumnSkeleton[] = [
  { cell: 'check', className: 'w-12 sm:w-10 pl-4 pr-1 sm:px-4' },
  { cell: 'twoLine', header: 'w-16', className: 'pl-4 pr-2 sm:px-4 sm:w-[24%]', widths: ['w-28', 'w-20'] },
  { cell: 'text', header: 'w-12', className: 'hidden sm:table-cell w-[18%]', widths: ['w-28'] },
  { cell: 'pill', header: 'w-24', className: 'hidden sm:table-cell w-[20%]', widths: ['w-24'] },
  { cell: 'pill', header: 'w-12', className: 'hidden sm:table-cell sm:w-[24%]', widths: ['w-28'] },
  { cell: 'actions', header: 'w-14', className: 'w-1/2 sm:w-[14%] sm:pr-6' },
];

export default function Loading() {
  return (
    <SkeletonPage label="Loading operators">
      <PageHeaderSkeleton titleWidth="w-28" descriptionWidth="w-64" actionWidth="w-36" />
      <ToolbarSkeleton
        stack="lg"
        selects={['flex-1 min-w-0 lg:flex-none lg:w-36', 'flex-1 min-w-0 lg:flex-none lg:w-40']}
      />
      <div className="flex items-center justify-between px-0.5">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-3 w-44 rounded-md" />
      </div>
      <ListBodySkeleton
        columns={COLUMNS}
        tableClassName="table-fixed sm:table-auto"
        tile={
          <EntityTileSkeleton
            rows={[{ width: 'w-24', pill: 'w-14' }, { width: 'w-32' }, { width: 'w-28' }]}
          />
        }
      />
    </SkeletonPage>
  );
}
