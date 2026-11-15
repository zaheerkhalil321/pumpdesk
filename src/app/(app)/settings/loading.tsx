import { SkeletonPage } from '@/components/skeletons/skeleton-page';
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton';

export default function Loading() {
  return (
    <SkeletonPage label="Loading settings" padded={false} className="min-h-full flex flex-col bg-slate-50/50">
      <SettingsSkeleton />
    </SkeletonPage>
  );
}
