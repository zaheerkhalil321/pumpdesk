import { notFound } from 'next/navigation';

import { listCustomerNotificationRows } from '@/features/notifications/server/queries';
import { requireSession } from '@/server/session';
import { getCustomer } from '@/features/crm/server/queries';
import { CustomerDetailView } from './customer-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [customer, session, notificationRows] = await Promise.all([
    getCustomer(id),
    requireSession(),
    listCustomerNotificationRows(id),
  ]);
  if (!customer) notFound();
  return (
    <CustomerDetailView
      customer={customer}
      notificationRows={notificationRows}
      canEditNotifications={['owner', 'admin', 'dispatcher', 'office'].includes(session.role)}
    />
  );
}
