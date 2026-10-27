import { OrdersDirectory } from '@/components/orders/orders-directory';
import { listOrders } from '@/features/orders/server/queries';

export default async function OrdersPage() {
  const orders = await listOrders();
  return <OrdersDirectory orders={orders} />;
}
