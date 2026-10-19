import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { requireSession } from '@/server/session';

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <AppShell>{children}</AppShell>;
}
