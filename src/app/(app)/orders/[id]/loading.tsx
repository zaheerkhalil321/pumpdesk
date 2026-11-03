import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64 w-full lg:col-span-2" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
