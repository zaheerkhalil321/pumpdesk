import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** A label and a text box, the way the order form lays out one field. */
function FieldSkeleton({ labelWidth = 'w-20', tall = false }: { labelWidth?: string; tall?: boolean }) {
  return (
    <div>
      <Skeleton className={cn('mb-1.5 h-3 rounded-md', labelWidth)} />
      <Skeleton className={cn('w-full rounded-lg', tall ? 'h-16' : 'h-9')} />
    </div>
  );
}

interface FormCardSkeletonProps {
  titleWidth: string;
  /** Number of fields, laid out two across from sm up. */
  fields: number;
  /** A full-width tall box under the fields (notes). */
  notes?: boolean;
  className?: string;
}

/** A form card: title and a grid of fields. */
function FormCardSkeleton({ titleWidth, fields, notes = false, className }: FormCardSkeletonProps) {
  return (
    <div className={cn('p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4', className)}>
      <div className="flex h-5 items-center">
        <Skeleton className={cn('h-4 rounded-md', titleWidth)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {Array.from({ length: fields }, (_, index) => (
          <FieldSkeleton key={index} labelWidth={index % 2 === 0 ? 'w-20' : 'w-28'} />
        ))}
      </div>
      {notes && <FieldSkeleton labelWidth="w-32" tall />}
    </div>
  );
}

/** The New order page: breadcrumb, title with Status and buttons, then two columns of form cards. */
export function OrderFormSkeleton() {
  return (
    <>
      <div className="flex h-4 items-center gap-1.5">
        <Skeleton className="h-3 w-14 rounded-md" />
        <Skeleton className="h-3.5 w-3.5 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex h-7 sm:h-8 items-center">
          <Skeleton className="h-5 sm:h-6 w-32 rounded-md" />
        </div>
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <Skeleton className="h-3 w-12 rounded-md" />
            <Skeleton className="h-8 w-40 sm:w-44 rounded-md" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-16 sm:w-20 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <FormCardSkeleton titleWidth="w-28" fields={4} />
          <FormCardSkeleton titleWidth="w-24" fields={3} notes />
          <FormCardSkeleton titleWidth="w-36" fields={2} notes />
        </div>
        <div className="space-y-5">
          <FormCardSkeleton titleWidth="w-24" fields={4} />
          <FormCardSkeleton titleWidth="w-24" fields={4} />
          <FormCardSkeleton titleWidth="w-28" fields={2} notes />
        </div>
      </div>
    </>
  );
}
