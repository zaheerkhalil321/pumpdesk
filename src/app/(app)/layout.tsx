'use client';

import React from 'react';
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SettingsProvider, useSettings } from "@/components/providers/settings-provider";
import { SettingsOverlay } from "@/components/settings/settings-overlay";
import { cn } from "@/lib/utils";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSettings();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <AppSidebar />

      {/* Main workspace container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative">

        {/* Workspace content — fades back when settings is open */}
        <main
          className={cn(
            'flex-1 overflow-auto bg-muted/30 transition-[opacity,filter] duration-300 ease-out',
            isOpen && 'opacity-40 blur-[2px] pointer-events-none'
          )}
        >
          {children}
        </main>

        {/* Settings layer — crossfades in with subtle rightward shift */}
        <SettingsOverlay />
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SettingsProvider>
  );
}