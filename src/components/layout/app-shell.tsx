'use client';

import React from 'react';
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavbar } from "@/components/layout/mobile-navbar";
import { SettingsProvider, useSettings } from "@/components/providers/settings-provider";
import { SettingsOverlay } from "@/components/settings/settings-overlay";
import { cn } from "@/lib/utils";
import type { NavCounts } from "@/features/orders/types";

import { usePathname } from "next/navigation";

function AppShellInner({ children, navCounts }: { children: React.ReactNode; navCounts: NavCounts }) {
  const { isOpen } = useSettings();
  const pathname = usePathname();
  const isSettingsRoute = pathname?.startsWith('/settings');

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background">
      {/* Mobile top navigation & drawer (visible on mobile < md) */}
      <MobileNavbar navCounts={navCounts} />

      {/* Desktop sidebar (visible on desktop md+) */}
      <AppSidebar navCounts={navCounts} />

      {/* Main workspace container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative">

        {/* Workspace content */}
        <main
          className={cn(
            'flex-1 overflow-auto bg-muted/30 transition-[opacity,filter] duration-300 ease-out',
            isOpen && !isSettingsRoute && 'opacity-40 blur-[2px] pointer-events-none'
          )}
        >
          {children}
        </main>

        {/* Quick theme settings overlay — only shown on other pages */}
        {!isSettingsRoute && <SettingsOverlay />}
      </div>
    </div>
  );
}

export function AppShell({
  children,
  navCounts,
}: {
  children: React.ReactNode;
  navCounts: NavCounts;
}) {
  return (
    <SettingsProvider>
      <AppShellInner navCounts={navCounts}>{children}</AppShellInner>
    </SettingsProvider>
  );
}