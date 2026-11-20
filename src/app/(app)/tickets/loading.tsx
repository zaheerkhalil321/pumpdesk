import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { OrdersControlsSkeleton } from '@/components/skeletons/orders-controls-skeleton';
import { ListBodySkeleton } from '@/components/skeletons/list-body-skeleton';
import { OrderTileSkeleton } from '@/components/skeletons/tile-skeleton';
import type { TableColumnSkeleton } from '@/components/skeletons/table-skeleton';

const COLUMNS: TableColumnSkeleton[] = [
  { cell: 'text', header: 'w-16', className: 'px-4 sm:px-6', widths: ['w-20'] },
  { cell: 'twoLine', header: 'w-24', widths: ['w-24', 'w-16'] },
  { cell: 'twoLine', header: 'w-32', widths: ['w-36', 'w-48'] },
  { cell: 'twoLine', header: 'w-28', widths: ['w-24', 'w-20'] },
  { cell: 'twoLine', header: 'w-20', widths: ['w-16', 'w-14'] },
  { cell: 'pill', header: 'w-16', widths: ['w-20'] },
  { cell: 'chevron', className: 'sm:pr-6' },
];

export default function Loading() {
  return (
    <SkeletonPage label="Loading work tickets">
      <PageHeaderSkeleton titleWidth="w-28" descriptionWidth="w-72" actionWidth="w-28" />
      <OrdersControlsSkeleton />
      <ListBodySkeleton columns={COLUMNS} tile={<OrderTileSkeleton />} footer />
    </SkeletonPage>
  );
}
