import { notFound } from 'next/navigation';

import { getCustomer } from '@/features/crm/server/queries';
import { CustomerDetailView } from './customer-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  return <CustomerDetailView customer={customer} />;
}
