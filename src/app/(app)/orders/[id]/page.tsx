import { notFound } from 'next/navigation';

import { OrderDetailView } from './order-detail-view';
import { getOrder, getOrderFormOptions } from '@/features/orders/server/queries';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [order, options] = await Promise.all([getOrder(id), getOrderFormOptions()]);
  if (!order) notFound();
  return <OrderDetailView key={`${order.id}-${order.version}`} order={order} options={options} />;
}
