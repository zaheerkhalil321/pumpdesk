import { BrandLoader } from '@/components/ui/loader';

export default function AppLoading() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <BrandLoader message="Loading workspace" size="md" />
    </div>
  );
}
