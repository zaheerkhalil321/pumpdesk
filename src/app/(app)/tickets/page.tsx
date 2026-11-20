import type { Metadata } from 'next';

import { TicketsDirectory } from '@/components/tickets/tickets-directory';
import { todayIn } from '@/features/fleet/mappers';
import { listTickets } from '@/features/tickets/server/queries';
import { requireSession } from '@/server/session';

export const metadata: Metadata = {
  title: 'Work tickets',
};

export default async function TicketsPage() {
  const session = await requireSession();
  const tickets = await listTickets();
  return <TicketsDirectory tickets={tickets} todayIso={todayIn(session.timezone)} />;
}
