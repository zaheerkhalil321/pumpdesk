import { CustomerDetailView } from './customer-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CustomerDetailView customerId={id} />;
}