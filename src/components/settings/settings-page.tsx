'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SettingsThemeBar,
  SettingsMainTab,
} from '@/components/settings/settings-theme-bar';
import { SettingsHub } from '@/components/settings/settings-hub';
import { CompanySettingsTab, type CompanySubTab } from '@/components/settings/company-settings-tab';
import { PricingSettingsTab } from '@/components/settings/pricing-settings-tab';
import { NotificationsSettingsTab } from '@/components/settings/notifications-settings-tab';
import { ListsSettingsTab } from '@/components/settings/lists-settings-tab';
import { IntegrationsSettingsTab } from '@/components/settings/integrations-settings-tab';
import type { SupplierItem } from '@/features/suppliers/types';
import type { YardItem } from '@/features/yards/types';
import type { CompanyProfile } from '@/features/company/types';
import type { BranchItem } from '@/features/branches/types';

interface SettingsPageProps {
  suppliers: SupplierItem[];
  logoUrl: string | null;
  yards: YardItem[];
  branches: BranchItem[];
  /** Owners and admins only; others see the branches without the edit buttons. */
  canEditBranches: boolean;
  profile: CompanyProfile;
}

function SettingsContent({ suppliers, logoUrl, yards, branches, canEditBranches, profile }: SettingsPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as SettingsMainTab | null;
  const currentTab: SettingsMainTab =
    tabParam &&
    ['overview', 'company', 'pricing', 'notifications', 'lists', 'integrations'].includes(
      tabParam
    )
      ? tabParam
      : 'overview';

  // "?tab=company&section=branches" opens the Branches sub-tab, e.g. from the sidebar's branch menu.
  const section = searchParams.get('section');
  const companySubTab: CompanySubTab =
    section === 'branches' || section === 'preferences' ? section : 'profile';

  const handleTabChange = (newTab: SettingsMainTab) => {
    const url = newTab === 'overview' ? '/settings' : `/settings?tab=${newTab}`;
    router.replace(url);
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50/50">
      {/* ── Top Bar with Breadcrumbs, Log Out, and Theme Palette Strip ── */}
      <SettingsThemeBar
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />

      {/* ── Tab Content Container ── */}
      <div className="flex-1 pb-16">
        {currentTab === 'overview' && (
          <SettingsHub onSelectTab={handleTabChange} />
        )}

        {currentTab === 'company' && (
          <CompanySettingsTab
            // A new section in the link reopens the tab on that section.
            key={companySubTab}
            logoUrl={logoUrl}
            yards={yards}
            branches={branches}
            canEditBranches={canEditBranches}
            profile={profile}
            initialSubTab={companySubTab}
          />
        )}

        {currentTab === 'pricing' && <PricingSettingsTab />}

        {currentTab === 'notifications' && <NotificationsSettingsTab />}

        {currentTab === 'lists' && <ListsSettingsTab suppliers={suppliers} />}

        {currentTab === 'integrations' && <IntegrationsSettingsTab />}
      </div>
    </div>
  );
}

export function SettingsPage({ suppliers, logoUrl, yards, branches, canEditBranches, profile }: SettingsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center text-xs text-muted-foreground animate-pulse">
          Loading settings...
        </div>
      }
    >
      <SettingsContent
        suppliers={suppliers}
        logoUrl={logoUrl}
        yards={yards}
        branches={branches}
        canEditBranches={canEditBranches}
        profile={profile}
      />
    </Suspense>
  );
}