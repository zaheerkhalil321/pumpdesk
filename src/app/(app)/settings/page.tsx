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
import { toast } from 'sonner';

function SettingsContent() {
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

  const handleSave = () => {
    toast.success('Changes saved successfully', {
      description: 'Your configuration updates are now active across PumpDesk.',
    });
  };

  const handleCancel = () => {
    toast.info('Changes discarded');
    handleTabChange('overview');
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50/50">
      {/* ── Top Bar with Breadcrumbs, Save/Cancel, and Theme Palette Strip ── */}
      <SettingsThemeBar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* ── Tab Content Container ── */}
      <div className="flex-1 pb-16">
        {currentTab === 'overview' && (
          <SettingsHub onSelectTab={handleTabChange} />
        )}

        {currentTab === 'company' && <CompanySettingsTab />}

        {currentTab === 'pricing' && <PricingSettingsTab />}

        {currentTab === 'notifications' && <NotificationsSettingsTab />}

        {currentTab === 'lists' && <ListsSettingsTab />}

        {currentTab === 'integrations' && <IntegrationsSettingsTab />}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center text-xs text-muted-foreground animate-pulse">
          Loading settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}