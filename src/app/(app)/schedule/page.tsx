import { ScheduleBoard } from '@/components/schedule/schedule-board';
import type { PumpLane } from '@/components/schedule/schedule-types';
import { getPumpDisplayName } from '@/features/fleet/format';
import { todayIn } from '@/features/fleet/mappers';
import { listCredentialAlerts, listPumps } from '@/features/fleet/server/queries';
import { getOrderFormOptions, listSchedule } from '@/features/orders/server/queries';
import { requireSession } from '@/server/session';

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireSession();
  const requested = typeof params.date === 'string' ? params.date : '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : todayIn(session.timezone);

  const [credentialAlerts, pumps, orderOptions, schedule] = await Promise.all([
    listCredentialAlerts(),
    listPumps(),
    getOrderFormOptions(),
    listSchedule(date),
  ]);

  // One schedule lane per real pump.
  const lanes: PumpLane[] = pumps.map((pump) => ({
    id: pump.id,
    code: getPumpDisplayName(pump),
    name: `${pump.make} ${pump.model}`.trim(),
    boomLength: pump.boomLength,
    operator: pump.defaultOperator.name || null,
    status: pump.status === 'maintenance' ? 'maintenance' : 'active',
  }));

  return (
    <ScheduleBoard
      credentialAlerts={credentialAlerts}
      pumps={lanes}
      orderOptions={orderOptions}
      date={date}
      bookings={schedule.bookings}
      unassignedJobs={schedule.unassigned}
    />
  );
}
