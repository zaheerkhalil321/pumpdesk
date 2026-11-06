'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SettingsThemeBar,
  SettingsMainTab,
} from '@/components/settings/settings-theme-bar';
import { SettingsHub } from '@/components/settings/settings-hub';
import { CompanySettingsTab } from '@/components/settings/company-settings-tab';
import { PricingSettingsTab } from '@/components/settings/pricing-settings-tab';
import { NotificationsSettingsTab } from '@/components/settings/notifications-settings-tab';
import { ListsSettingsTab } from '@/components/settings/lists-settings-tab';
import { IntegrationsSettingsTab } from '@/components/settings/integrations-settings-tab';
import type { SupplierItem } from '@/features/suppliers/types';
import type { YardItem } from '@/features/yards/types';
import type { CompanyProfile } from '@/features/company/types';

interface SettingsPageProps {
  suppliers: SupplierItem[];
  logoUrl: string | null;
  yards: YardItem[];
  profile: CompanyProfile;
}

function SettingsContent({ suppliers, logoUrl, yards, profile }: SettingsPageProps) {
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

        {currentTab === 'company' && <CompanySettingsTab logoUrl={logoUrl} yards={yards} profile={profile} />}

        {currentTab === 'pricing' && <PricingSettingsTab />}

        {currentTab === 'notifications' && <NotificationsSettingsTab />}

        {currentTab === 'lists' && <ListsSettingsTab suppliers={suppliers} />}

        {currentTab === 'integrations' && <IntegrationsSettingsTab />}
      </div>
    </div>
  );
}

export function SettingsPage({ suppliers, logoUrl, yards, profile }: SettingsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center text-xs text-muted-foreground animate-pulse">
          Loading settings...
        </div>
      }
    >
      <SettingsContent suppliers={suppliers} logoUrl={logoUrl} yards={yards} profile={profile} />
    </Suspense>
  );
}