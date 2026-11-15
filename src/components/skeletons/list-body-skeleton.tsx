import type { ReactNode } from 'react';

import { TableFooterSkeleton, TableSkeleton, type TableColumnSkeleton } from './table-skeleton';

interface ListBodySkeletonProps {
  columns: TableColumnSkeleton[];
  /** One tile card; it is repeated to fill the grid. */
  tile: ReactNode;
  tableRows?: number;
  tileCount?: number;
  /** Class on the `<table>`, e.g. "table-fixed sm:table-auto". */
  tableClassName?: string;
  /** The helper text and Previous / Next buttons under the list (Orders). */
  footer?: boolean;
}

/**
 * The body of a directory page. The real pages show tiles from 768 to 1023 wide and a table everywhere
 * else, so this does too. Both are in the markup and CSS picks the one that fits.
 */
export function ListBodySkeleton({
  columns,
  tile,
  tableRows = 8,
  tileCount = 6,
  tableClassName,
  footer = false,
}: ListBodySkeletonProps) {
  return (
    <>
      <TableSkeleton
        columns={columns}
        rows={tableRows}
        tableClassName={tableClassName}
        footer={footer}
        className="md:max-lg:hidden"
      />
      <div className="hidden md:max-lg:block space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: tileCount }, (_, index) => (
            <div key={index} className="contents">
              {tile}
            </div>
          ))}
        </div>
        {footer && (
          <TableFooterSkeleton className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs" />
        )}
      </div>
    </>
  );
}
