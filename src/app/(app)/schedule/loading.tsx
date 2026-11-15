import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { ScheduleSkeleton } from '@/components/skeletons/schedule-skeleton';

export default function Loading() {
  return (
    <SkeletonPage label="Loading schedule" className="space-y-4">
      <ScheduleSkeleton />
    </SkeletonPage>
  );
}
