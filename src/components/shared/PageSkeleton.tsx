import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-6">

      <Skeleton className="h-8 w-64" />

      <Skeleton className="h-32 rounded-xl" />

      <Skeleton className="h-32 rounded-xl" />

      <Skeleton className="h-32 rounded-xl" />

    </div>
  );
}