import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { getCompanyLogoUrl } from '@/features/company/server/queries';
import { getNavCounts } from '@/features/orders/server/queries';
import { requireSession } from '@/server/session';

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  const [navCounts, logoUrl] = await Promise.all([getNavCounts(), getCompanyLogoUrl()]);
  return (
    <AppShell navCounts={navCounts} logoUrl={logoUrl}>
      {children}
    </AppShell>
  );
}
