import { SettingsPage } from '@/components/settings/settings-page';
import { getCompanyLogoUrl, getCompanyProfile } from '@/features/company/server/queries';
import { listSuppliers } from '@/features/suppliers/server/queries';
import { listYards } from '@/features/yards/server/queries';
import { listBranches } from '@/features/branches/server/queries';
import { BRANCH_EDITORS } from '@/features/branches/schemas';
import { requireSession } from '@/server/session';

export default async function Page() {
  const [session, suppliers, logoUrl, yards, branches, profile] = await Promise.all([
    requireSession(),
    listSuppliers(),
    getCompanyLogoUrl(),
    listYards(),
    listBranches(),
    getCompanyProfile(),
  ]);
  const canEditBranches = (BRANCH_EDITORS as readonly string[]).includes(session.role);
  return (
    <SettingsPage
      suppliers={suppliers}
      logoUrl={logoUrl}
      yards={yards}
      branches={branches}
      canEditBranches={canEditBranches}
      profile={profile}
    />
  );
}
