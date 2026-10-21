import { formatInTimeZone } from 'date-fns-tz';

import { PumpsDirectory } from '@/components/pumps/pumps-directory';
import { listBranchOptions, listOperators, listPumps } from '@/features/fleet/server/queries';
import { requireSession } from '@/server/session';

export default async function PumpsPage() {
  const session = await requireSession();
  const [pumps, operators, branchOptions] = await Promise.all([
    listPumps(),
    listOperators(),
    listBranchOptions(),
  ]);
  const todayLabel = formatInTimeZone(new Date(), session.timezone, 'MMM d, yyyy');
  return (
    <PumpsDirectory
      pumps={pumps}
      operators={operators}
      branchOptions={branchOptions}
      todayLabel={todayLabel}
    />
  );
}
