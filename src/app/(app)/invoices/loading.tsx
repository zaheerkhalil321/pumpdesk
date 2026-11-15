import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton';
import { StatBlockSkeleton } from '@/components/skeletons/stat-card-skeleton';
import { TableSkeleton, type TableColumnSkeleton } from '@/components/skeletons/table-skeleton';

const COLUMNS: TableColumnSkeleton[] = [
  { cell: 'text', header: 'w-16', widths: ['w-28'] },
  { cell: 'text', header: 'w-24', widths: ['w-32'] },
  { cell: 'text', header: 'w-16', widths: ['w-36'] },
  { cell: 'text', header: 'w-10', widths: ['w-24'] },
  { cell: 'text', header: 'w-24', widths: ['w-20'] },
  { cell: 'pill', header: 'w-24', className: 'w-40', widths: ['w-32'] },
];

export default function Loading() {
  return (
    <SkeletonPage label="Loading billing">
      <PageHeaderSkeleton titleWidth="w-44" descriptionWidth="w-96 max-w-full" actionWidth="w-52" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBlockSkeleton />
        <StatBlockSkeleton />
        <StatBlockSkeleton />
      </div>
      <TableSkeleton columns={COLUMNS} rows={5} className="rounded-lg border-border" />
    </SkeletonPage>
  );
}
