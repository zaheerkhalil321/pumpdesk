import { ScheduleBoard } from '@/components/schedule/schedule-board';
import { listCredentialAlerts } from '@/features/fleet/server/queries';

export default async function SchedulePage() {
  const credentialAlerts = await listCredentialAlerts();
  return <ScheduleBoard credentialAlerts={credentialAlerts} />;
}
