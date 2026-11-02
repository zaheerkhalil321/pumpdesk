import { OperatorMap } from '@/components/map/operator-map';
import { requireSession } from '@/server/session';

export default async function MapPage() {
  await requireSession();
  return <OperatorMap />;
}
