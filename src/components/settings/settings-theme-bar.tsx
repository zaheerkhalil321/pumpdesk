'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { LogoutDialog } from '@/components/auth/logout-dialog';
import { cn } from '@/lib/utils';

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
