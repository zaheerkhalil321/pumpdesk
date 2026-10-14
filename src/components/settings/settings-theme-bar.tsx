'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Check, Paintbrush, ArrowLeft, LogOut } from 'lucide-react';
import { useBrandTheme } from '@/components/providers/brand-theme-provider';
import { LogoutDialog } from '@/components/auth/logout-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type SettingsMainTab =
  | 'overview'
  | 'company'
  | 'pricing'
  | 'notifications'
  | 'lists'
  | 'integrations';

interface SettingsThemeBarProps {
  currentTab: SettingsMainTab;
  onTabChange: (tab: SettingsMainTab) => void;
  breadcrumbSub?: string;
}

export function SettingsThemeBar({
  currentTab,
  onTabChange,
  breadcrumbSub,
}: SettingsThemeBarProps) {
  const { brandTheme, setBrandTheme, themes } = useBrandTheme();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const navContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const container = navContainerRef.current;
    const button = tabRefs.current[currentTab];
    if (container && button) {
      const buttonRect = button.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      const containerCenter = containerRect.left + containerRect.width / 2;
      container.scrollBy({
        left: buttonCenter - containerCenter,
        behavior: 'smooth',
      });
    }
  }, [currentTab]);

  const handleThemeChange = (id: typeof brandTheme) => {
    setBrandTheme(id);
    const chosen = themes.find((t) => t.id === id);
    toast.success(`Theme updated to ${chosen?.name || id}`, {
      description: 'Workspace palette and accent styling updated immediately.',
    });
  };

  const getBreadcrumbs = () => {
    if (currentTab === 'overview') {
      return (
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </span>
      );
    }

    const tabLabels: Record<SettingsMainTab, string> = {
      overview: 'Settings',
      company: 'Company',
      pricing: 'Pricing & billing',
      notifications: 'Notifications',
      lists: 'Lists & suppliers',
      integrations: 'Integrations',
    };

    return (
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="text-brand hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </button>
        <span className="text-slate-400">›</span>
        <button
          type="button"
          onClick={() => onTabChange(currentTab)}
          className={cn(
            'font-medium transition-colors cursor-pointer',
            breadcrumbSub ? 'text-brand hover:underline' : 'text-slate-800 font-semibold'
          )}
        >
          {tabLabels[currentTab]}
        </button>
        {breadcrumbSub && (
          <>
            <span className="text-slate-400">›</span>
            <span className="text-slate-800 font-semibold">{breadcrumbSub}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white border-b border-slate-200/90 shadow-2xs">
      {/* ── Top Level Header: Breadcrumbs & Action Buttons ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">{getBreadcrumbs()}</div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-semibold text-slate-600 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Sign out of PumpDesk"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* ── Prominent Brand Theme Color Palette Strip (Requested by User) ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 bg-slate-50/70 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <div className="h-5 w-5 rounded-md bg-brand-light text-brand flex items-center justify-center shrink-0 border border-brand/20">
            <Paintbrush className="h-3 w-3" />
          </div>
          <span className="font-semibold text-slate-800">Workspace Theme:</span>
          <span className="text-slate-500 hidden sm:inline">
            Choose brand colors for your dispatch board and tickets
          </span>
        </div>

        {/* 4 Theme Color Swatches */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {themes.map((t) => {
            const isSelected = brandTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer border',
                  isSelected
                    ? 'bg-white border-2 border-brand text-slate-900 shadow-2xs font-semibold'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                )}
                title={`${t.name} • ${t.tagline}`}
              >
                {/* Circular Color Swatch */}
                <span
                  className={cn(
                    'h-4 w-4 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-transform',
                    t.swatchClass,
                    isSelected && 'scale-110'
                  )}
                >
                  {isSelected && (
                    <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                  )}
                </span>

                <span className="truncate max-w-[100px] sm:max-w-none">
                  {t.name}
                </span>

                {isSelected && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-light px-1.5 py-0.2 rounded-sm shrink-0 border border-brand/20">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Settings Navigation Tabs Bar ── */}
      <div
        ref={navContainerRef}
        className="px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 overflow-x-auto scrollbar-none scroll-smooth"
      >
        <nav className="flex space-x-1 sm:space-x-2 py-1 min-w-max">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'company' as const, label: 'Company' },
            { id: 'pricing' as const, label: 'Pricing & billing' },
            { id: 'notifications' as const, label: 'Notifications' },
            { id: 'lists' as const, label: 'Lists & suppliers' },
            { id: 'integrations' as const, label: 'Integrations' },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors relative cursor-pointer rounded-md select-none',
                  isActive
                    ? 'text-brand font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand rounded-full transition-all" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      />
    </div>
  );
}
