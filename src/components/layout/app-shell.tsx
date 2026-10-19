'use client';

import React from 'react';
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavbar } from "@/components/layout/mobile-navbar";
import { SettingsProvider, useSettings } from "@/components/providers/settings-provider";
import { SettingsOverlay } from "@/components/settings/settings-overlay";
import { cn } from "@/lib/utils";

import { usePathname } from "next/navigation";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSettings();
  const pathname = usePathname();
  const isSettingsRoute = pathname?.startsWith('/settings');

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background">
      {/* Mobile top navigation & drawer (visible on mobile < md) */}
      <MobileNavbar />

      {/* Desktop sidebar (visible on desktop md+) */}
      <AppSidebar />

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
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <AppShellInner>{children}</AppShellInner>
    </SettingsProvider>
  );
}