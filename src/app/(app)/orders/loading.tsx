import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { OrdersControlsSkeleton } from '@/components/skeletons/orders-controls-skeleton';
import { ListBodySkeleton } from '@/components/skeletons/list-body-skeleton';
import { OrderTileSkeleton } from '@/components/skeletons/tile-skeleton';
import type { TableColumnSkeleton } from '@/components/skeletons/table-skeleton';

const COLUMNS: TableColumnSkeleton[] = [
  { cell: 'text', header: 'w-12', className: 'px-4 sm:px-6', widths: ['w-16'] },
  { cell: 'twoLine', header: 'w-28', widths: ['w-24', 'w-14'] },
  { cell: 'twoLine', header: 'w-32', widths: ['w-36', 'w-48'] },
  { cell: 'twoLine', header: 'w-24', widths: ['w-20', 'w-24'] },
  { cell: 'pill', header: 'w-16', widths: ['w-24'] },
  { cell: 'text', header: 'w-14', widths: ['w-20'] },
  { cell: 'chevron', className: 'sm:pr-6' },
];

export default function Loading() {
  return (
    <SkeletonPage label="Loading orders">
      <PageHeaderSkeleton titleWidth="w-24" descriptionWidth="w-80" actionWidth="w-32" />
      <OrdersControlsSkeleton />
      <ListBodySkeleton columns={COLUMNS} tile={<OrderTileSkeleton />} footer />
    </SkeletonPage>
  );
}
