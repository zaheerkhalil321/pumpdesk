'use client';

import React, { useEffect, useState } from 'react';
import {
  Upload,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { AppSelect } from '@/components/ui/app-select';
import {
  useSettingsStore,
  updateCompanyDetails,
  CompanyDetails,
} from '@/lib/settings-store';
import { useBrandTheme } from '@/components/providers/brand-theme-provider';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { reportAction } from '@/lib/action-feedback';
import { removeCompanyLogo, uploadCompanyLogo } from '@/features/company/server/actions';
import { LOGO_ACCEPT, LOGO_MAX_BYTES } from '@/features/company/logo';
import { LOGO_SOURCE_MAX_BYTES, readImage } from '@/features/company/crop-logo';
import { LogoCropDialog } from '@/components/settings/logo-crop-dialog';
import { YardsCard } from '@/components/settings/yards-card';
import { BranchesCard } from '@/components/settings/branches-card';
import type { BranchItem } from '@/features/branches/types';
import type { YardItem } from '@/features/yards/types';
import type { CompanyProfile } from '@/features/company/types';
import { updateCompanyProfile } from '@/features/company/server/actions';
import { US_STATES } from '@/features/company/states';
import { PhoneInput, phoneProblem } from '@/components/ui/phone-input';

export type CompanySubTab = 'profile' | 'branches' | 'preferences';

export function CompanySettingsTab({
  logoUrl,
  yards,
  branches,
  canEditBranches,
  profile,
  initialSubTab = 'profile',
}: {
  logoUrl: string | null;
  yards: YardItem[];
  branches: BranchItem[];
  canEditBranches: boolean;
  profile: CompanyProfile;
  /** The sub-tab to open on, e.g. "branches" from the sidebar's branch menu. */
  initialSubTab?: CompanySubTab;
}) {
  const router = useRouter();
  const [isLogoBusy, setIsLogoBusy] = useState(false);
  // The picture just chosen, waiting in the crop box.
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const settings = useSettingsStore();
  const { company } = settings;
  const { brandTheme, setBrandTheme, themes } = useBrandTheme();

  const [activeSubTab, setActiveSubTab] = useState<CompanySubTab>(initialSubTab);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleFieldChange = <K extends keyof CompanyDetails>(
    field: K,
    value: CompanyDetails[K]
  ) => {
    updateCompanyDetails({ [field]: value });
  };

  // The form edits the shared settings store; start it from what is saved in the database.
  useEffect(() => {
    updateCompanyDetails({ ...profile, country: 'United States' });
  }, [profile]);

  const handleSaveProfile = async () => {
    const phoneIssue = phoneProblem(company.phone);
    if (phoneIssue) {
      toast.error(phoneIssue);
      return;
    }
    setIsSavingProfile(true);
    const result = await updateCompanyProfile({
      companyName: company.companyName,
      legalBusinessName: company.legalBusinessName,
      phone: company.phone,
      email: company.email,
      website: company.website,
      streetAddress: company.streetAddress,
      suiteUnit: company.suiteUnit,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      useAddressOnInvoices: company.useAddressOnInvoices,
    });
    setIsSavingProfile(false);
    if (!result.ok) {
      const first = result.fieldErrors ? Object.values(result.fieldErrors)[0]?.[0] : undefined;
      if (first) toast.error(first);
      else reportAction(result, { entity: 'company profile' });
      return;
    }
    toast.success('Company profile saved', {
      description: 'Your business details and address have been updated.',
    });
    router.refresh();
  };

  const handleLogoChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!LOGO_ACCEPT.split(',').includes(file.type)) {
      toast.error('The logo must be a PNG, JPG or WebP image.');
      return;
    }
    if (file.size > LOGO_SOURCE_MAX_BYTES) {
      toast.error('That picture is too big. Choose one under 15 MB.');
      return;
    }
    const picture = await readImage(file);
    if (!picture) {
      toast.error("That file can't be opened as a picture.");
      return;
    }
    setPendingLogo(picture);
  };

  /** Saves the cropped square. The server checks the file again before keeping it. */
  const handleLogoCropped = async (cropped: Blob) => {
    setPendingLogo(null);
    if (cropped.size > LOGO_MAX_BYTES) {
      toast.error('The logo must be 2 MB or smaller.');
      return;
    }
    setIsLogoBusy(true);
    const formData = new FormData();
    formData.append('logo', new File([cropped], 'logo.png', { type: 'image/png' }));
    const result = await uploadCompanyLogo(formData);
    setIsLogoBusy(false);
    if (!reportAction(result, { entity: 'logo', refresh: () => router.refresh() })) return;
    router.refresh();
    toast.success('Company logo saved', {
      description: 'It now shows in the side menu.',
    });
  };

  const handleRemoveLogo = async () => {
    setIsLogoBusy(true);
    const result = await removeCompanyLogo();
    setIsLogoBusy(false);
    if (!reportAction(result, { entity: 'logo', refresh: () => router.refresh() })) return;
    router.refresh();
    toast.info('Logo removed', {
      description: 'Back to the default monogram.',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <LogoCropDialog src={pendingLogo} onCancel={() => setPendingLogo(null)} onConfirm={handleLogoCropped} />

      {/* ── Sub-tabs Header (Profile, Branches, Preferences) ── */}
      <div className="border-b border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <nav className="flex space-x-6">
            {[
              { id: 'profile' as const, label: 'Profile' },
              { id: 'branches' as const, label: 'Branches' },
              { id: 'preferences' as const, label: 'Preferences' },
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    'pb-3 text-sm font-semibold transition-colors relative cursor-pointer',
                    isActive
                      ? 'text-brand'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {activeSubTab === 'profile' && (
            <div className="pb-2.5">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>{isSavingProfile ? 'Saving...' : 'Save changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: PROFILE (matches settings-company 1.png exactly) */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          {/* 1. Company logo Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
            <h3 className="font-bold text-base text-slate-900 mb-4">
              Company logo
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Logo Box */}
              <div className="h-20 w-20 rounded-xl bg-brand text-white flex items-center justify-center font-extrabold text-2xl tracking-wider shadow-xs overflow-hidden shrink-0 border border-brand/20">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Company logo"
                    className="h-full w-full object-contain bg-white"
                  />
                ) : (
                  company.logoText || 'MC'
                )}
              </div>

              {/* Action Buttons & Note */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95">
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <span>{isLogoBusy ? 'Saving...' : 'Upload logo'}</span>
                    <input
                      type="file"
                      accept={LOGO_ACCEPT}
                      disabled={isLogoBusy}
                      onChange={handleLogoChosen}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Shown in the side menu. PNG, JPG or WebP. You can crop and zoom it after choosing.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Business details Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
            <h3 className="font-bold text-base text-slate-900 mb-4">
              Business details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company name
                </label>
                <input
                  type="text"
                  value={company.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Legal business name
                </label>
                <input
                  type="text"
                  value={company.legalBusinessName}
                  onChange={(e) => handleFieldChange('legalBusinessName', e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone
                </label>
                <PhoneInput
                  value={company.phone}
                  onValueChange={(value) => handleFieldChange('phone', value)}
                  className="h-10 px-3.5 rounded-lg border-slate-300 bg-white text-xs sm:text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Website
                </label>
                <input
                  type="text"
                  value={company.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Company address Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
            <h3 className="font-bold text-base text-slate-900 mb-4">
              Company address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Street address
                </label>
                <input
                  type="text"
                  value={company.streetAddress}
                  onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Suite / unit
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={company.suiteUnit}
                    onChange={(e) => handleFieldChange('suiteUnit', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={company.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State
                  </label>
                  <AppSelect
                    value={company.state}
                    onChange={(val) => handleFieldChange('state', val)}
                    options={[...US_STATES]}
                    className="w-full h-10 rounded-lg text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ZIP code
                  </label>
                  <input
                    type="text"
                    value={company.zipCode}
                    onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Country
                </label>
                <AppSelect
                  value={company.country}
                  onChange={(val) => handleFieldChange('country', val)}
                  options={[
                    { value: 'United States', label: 'United States' },
                    { value: 'Canada', label: 'Canada' },
                  ]}
                  className="w-full h-10 rounded-lg text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <Checkbox
                  id="invoice-addr-checkbox"
                  checked={company.useAddressOnInvoices}
                  onCheckedChange={(checked) =>
                    handleFieldChange('useAddressOnInvoices', checked)
                  }
                />
                <label
                  htmlFor="invoice-addr-checkbox"
                  className="text-xs font-semibold text-slate-800 cursor-pointer select-none"
                >
                  Use this address on invoices
                </label>
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isSavingProfile ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{isSavingProfile ? 'Saving...' : 'Save changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: BRANCHES (Yards list)                            */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'branches' && (
        <div className="space-y-5">
          <BranchesCard branches={branches} canEdit={canEditBranches} />
          <YardsCard yards={yards} />
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 3: PREFERENCES & BRAND THEMES                       */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-6">
          {/* Detailed Brand Theme Selector Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <h3 className="font-bold text-base text-slate-900">
                  Brand Theme & Visual Style
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Customize your dispatch timeline colors, ticket headers, and primary accent palette.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {themes.map((t) => {
                const isSelected = brandTheme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setBrandTheme(t.id);
                      toast.success(`Theme switched to ${t.name}`);
                    }}
                    className={cn(
                      'p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 relative flex flex-col justify-between group active:scale-[0.98]',
                      isSelected
                        ? 'border-2 border-brand bg-brand-light/30 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    )}
                  >
                    <div>
                      {/* Swatch & Checkmark */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center shadow-xs transition-transform',
                            t.swatchClass,
                            isSelected && 'scale-105 border-2 border-white'
                          )}
                        >
                          {isSelected && (
                            <Check className="h-4 w-4 text-white stroke-[3]" />
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                          {t.accentBadge}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">
                        {t.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {t.tagline}
                      </p>
                    </div>

                    {/* Mini Ticket Preview */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-[11px]">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span className="truncate">{t.previewJobTitle}</span>
                          <span className="text-slate-500 text-[10px]">
                            {t.previewTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded font-medium text-[10px] text-white',
                              t.swatchClass
                            )}
                          >
                            {t.previewPump}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {t.previewVolume}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Presets */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Regional & Dispatch Presets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Timezone Standard
                </label>
                <input
                  type="text"
                  disabled
                  value="America/Chicago (Central Time)"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-600 font-mono cursor-not-allowed"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Enforced by platform rules to prevent hydration shifts.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pour Volume Unit
                </label>
                <AppSelect
                  defaultValue="yd3"
                  options={[
                    { value: 'yd3', label: 'Cubic Yards (yd³)' },
                    { value: 'm3', label: 'Cubic Meters (m³)' },
                  ]}
                  className="w-full h-10 rounded-lg text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date Format
                </label>
                <AppSelect
                  defaultValue="mm_dd_yyyy"
                  options={[
                    { value: 'mm_dd_yyyy', label: 'MM/DD/YYYY (US Standard)' },
                    { value: 'yyyy_mm_dd', label: 'YYYY-MM-DD (ISO)' },
                  ]}
                  className="w-full h-10 rounded-lg text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
