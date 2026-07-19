"use client";

import { Bell, Plus, Search } from "lucide-react";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

export function AppHeader() {

  const pathname = usePathname();
  const showBreadcrumbs = pathname !== "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      {/* Top Row */}
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger />

        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search jobs, companies, addresses..."
            className="pl-9"
          />
        </div>

        <Button>
          <Plus className="mr-2 size-4" />
          New Job
        </Button>

        <Button variant="ghost" size="icon">
          <Bell className="size-5" />
        </Button>

        <ThemeToggle />
      </div>

      {showBreadcrumbs && (
        <div className="border-t px-6 py-2">
          <AppBreadcrumbs />
        </div>
      )}
    </header>
  );
}