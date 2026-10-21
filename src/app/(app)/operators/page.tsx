import { formatInTimeZone } from 'date-fns-tz';

import { OperatorsDirectory } from '@/components/operators/operators-directory';
import { listBranchOptions, listOperators, listPumps } from '@/features/fleet/server/queries';
import { requireSession } from '@/server/session';

export default async function OperatorsPage() {
  const session = await requireSession();
  const [operators, pumps, branchOptions] = await Promise.all([
    listOperators(),
    listPumps(),
    listBranchOptions(),
  ]);
  const todayLabel = formatInTimeZone(new Date(), session.timezone, 'MMM d, yyyy');
  return (
    <OperatorsDirectory
      operators={operators}
      pumps={pumps}
      branchOptions={branchOptions}
      todayLabel={todayLabel}
    />
  );
}
