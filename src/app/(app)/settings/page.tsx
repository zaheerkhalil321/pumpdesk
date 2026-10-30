import { SettingsPage } from '@/components/settings/settings-page';
import { getCompanyLogoUrl } from '@/features/company/server/queries';
import { listSuppliers } from '@/features/suppliers/server/queries';

export default async function Page() {
  const [suppliers, logoUrl] = await Promise.all([listSuppliers(), getCompanyLogoUrl()]);
  return <SettingsPage suppliers={suppliers} logoUrl={logoUrl} />;
}
