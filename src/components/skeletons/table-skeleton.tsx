import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** What a column holds, so each row gets the right shape. */
export type TableCellKind =
  | 'check'
  | 'text'
  | 'twoLine'
  | 'avatarTwoLine'
  | 'pill'
  | 'actions'
  | 'chevron';

export interface TableColumnSkeleton {
  cell: TableCellKind;
  /** Width of the header label bar. Leave out for an empty header. */
  header?: string;
  /** Classes for both the header and the cells: width, "hidden sm:table-cell", padding. */
  className?: string;
  /** Widths of the one or two bars inside the cell. */
  widths?: [string, string?];
  /** Number of Call / Text style buttons in an "actions" cell. */
  buttons?: number;
}

interface TableSkeletonProps {
  columns: TableColumnSkeleton[];
  rows?: number;
  /** Class on the `<table>`, e.g. "table-fixed sm:table-auto". */
  tableClassName?: string;
  /** The "Select an order..." bar with page buttons under the table. */
  footer?: boolean;
  className?: string;
}

/** Mirrors the directory tables: header row, then rows with the real column widths. */
export function TableSkeleton({ columns, rows = 8, tableClassName, footer = false, className }: TableSkeletonProps) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden', className)}>
      <div className="overflow-hidden">
        <table className={cn('w-full text-left border-collapse text-xs sm:text-sm', tableClassName)}>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {columns.map((column, index) => (
                <th key={index} className={cn('py-3 px-4 font-normal', column.className)}>
                  {column.header && (
                    <div className="flex h-4 items-center">
                      <Skeleton className={cn('h-3 rounded-md', column.header)} />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                {columns.map((column, index) => (
                  <td key={index} className={cn('py-3.5 px-4', column.className)}>
                    <TableCellSkeleton column={column} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && <TableFooterSkeleton />}
    </div>
  );
}

function TableCellSkeleton({ column }: { column: TableColumnSkeleton }) {
  const [first = 'w-24', second = 'w-16'] = column.widths ?? [];
  switch (column.cell) {
    case 'check':
      return <Skeleton className="h-4 w-4 rounded" />;
    case 'text':
      return <Skeleton className={cn('h-3.5 rounded-md', first)} />;
    case 'twoLine':
      return <TwoLines first={first} second={second} />;
    case 'avatarTwoLine':
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-8.5 w-8.5 shrink-0 rounded-lg" />
          <TwoLines first={first} second={second} />
        </div>
      );
    case 'pill':
      return <Skeleton className={cn('h-6 rounded-full', first)} />;
    case 'actions':
      return (
        <div className="inline-flex items-center gap-1 sm:gap-1.5">
          {Array.from({ length: column.buttons ?? 2 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-14 sm:w-16 rounded-lg" />
          ))}
          <Skeleton className="h-8 w-6 sm:w-8 rounded-lg" />
        </div>
      );
    case 'chevron':
      return (
        <div className="flex justify-end">
          <Skeleton className="h-4 w-4 rounded-md" />
        </div>
      );
  }
}

function TwoLines({ first, second }: { first: string; second: string }) {
  return (
    <div className="min-w-0">
      <div className="flex h-4 sm:h-5 items-center">
        <Skeleton className={cn('h-3.5 rounded-md', first)} />
      </div>
      <div className="mt-0.5 flex h-4 items-center">
        <Skeleton className={cn('h-2.5 rounded-md', second)} />
      </div>
    </div>
  );
}

/** The helper line and Previous / Next buttons under the Orders table. */
export function TableFooterSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 border-t border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
        <Skeleton className="h-3 w-56 max-w-full rounded-md" />
      </div>
      <div className="flex items-center gap-3 self-end sm:self-center">
        <Skeleton className="h-3.5 w-24 rounded-md" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
