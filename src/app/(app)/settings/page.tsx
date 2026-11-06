import { SettingsPage } from '@/components/settings/settings-page';
import { getCompanyLogoUrl, getCompanyProfile } from '@/features/company/server/queries';
import { listSuppliers } from '@/features/suppliers/server/queries';
import { listYards } from '@/features/yards/server/queries';

export default async function Page() {
  const [suppliers, logoUrl, yards, profile] = await Promise.all([
    listSuppliers(),
    getCompanyLogoUrl(),
    listYards(),
    getCompanyProfile(),
  ]);
  return <SettingsPage suppliers={suppliers} logoUrl={logoUrl} yards={yards} profile={profile} />;
}
