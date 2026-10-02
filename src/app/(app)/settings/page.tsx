'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/components/providers/settings-provider';

export default function SettingsPage() {
  const router = useRouter();
  const { openSettings } = useSettings();

  useEffect(() => {
    openSettings();
    const stored =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('pumpdesk_last_path')
        : null;
    const target = stored && stored !== '/settings' ? stored : '/schedule';
    router.replace(target);
  }, [openSettings, router]);

  return (
    <div className="flex h-full min-h-[400px] w-full items-center justify-center p-8 text-center text-xs text-muted-foreground animate-pulse">
      Opening settings layer...
    </div>
  );
}