import { redirect } from 'next/navigation';

import { getOperator, listBranchOptions, listPumps } from '@/features/fleet/server/queries';
import { OperatorDetailView } from './operator-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OperatorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [operator, pumps, branchOptions] = await Promise.all([
    getOperator(id),
    listPumps(),
    listBranchOptions(),
  ]);
  // A deleted or unknown operator has no page: send people to the list rather than an empty screen.
  if (!operator) redirect('/operators');
  return <OperatorDetailView operator={operator} pumps={pumps} branchOptions={branchOptions} />;
}
