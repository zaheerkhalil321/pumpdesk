import { OperatorDetailView } from './operator-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OperatorDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OperatorDetailView operatorId={id} />;
}
