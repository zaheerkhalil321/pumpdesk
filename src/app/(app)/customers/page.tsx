import { CustomersDirectory } from '@/components/customers/customers-directory';
import { listCustomers } from '@/features/crm/server/queries';

export default async function CustomersPage() {
  const customers = await listCustomers();
  return <CustomersDirectory customers={customers} />;
}
