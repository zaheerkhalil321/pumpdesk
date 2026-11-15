import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { OrderFormSkeleton } from '@/components/skeletons/order-form-skeleton';

export default function Loading() {
  return (
    <SkeletonPage label="Loading new order form" className="max-w-6xl mx-auto space-y-5">
      <OrderFormSkeleton />
    </SkeletonPage>
  );
}
