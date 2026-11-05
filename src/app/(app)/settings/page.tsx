import { SettingsPage } from '@/components/settings/settings-page';
import { getCompanyLogoUrl } from '@/features/company/server/queries';
import { listSuppliers } from '@/features/suppliers/server/queries';
import { listYards } from '@/features/yards/server/queries';

export default async function Page() {
  const [suppliers, logoUrl, yards] = await Promise.all([listSuppliers(), getCompanyLogoUrl(), listYards()]);
  return <SettingsPage suppliers={suppliers} logoUrl={logoUrl} yards={yards} />;
}
