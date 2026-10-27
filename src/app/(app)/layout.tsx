import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { getNavCounts } from '@/features/orders/server/queries';
import { requireSession } from '@/server/session';

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  const navCounts = await getNavCounts();
  return <AppShell navCounts={navCounts}>{children}</AppShell>;
}
