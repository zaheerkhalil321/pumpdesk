"use client";

import { usePathname } from "next/navigation";
import { Plus, CloudSun, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/schedule": "Dispatch Schedule Board",
  "/orders": "Pour Orders Directory",
  "/customers": "Customers & Accounts",
  "/contacts": "Contacts & Superintendents",
  "/pumps": "Fleet & Equipment",
  "/operators": "Operators & Crew",
  "/invoices": "Tickets & Invoicing",
  "/settings": "Company Settings",
};

export function TopHud() {
  const pathname = usePathname();
  const currentTitle = pageTitles[pathname] || "Dispatch Operations";

  return (
    <header className="h-14 border-b border-border bg-background px-6 flex items-center justify-between shrink-0 select-none">
      {/* 1. SCREEN TITLE & STATUS */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-foreground tracking-tight">
          {currentTitle}
        </h1>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Boom Safety Verified</span>
        </div>
      </div>

      {/* 2. CENTER HUD STATUS CHIPS */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>8 Pumping</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>3 En Route</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>1 Washout</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground font-medium">
          <CloudSun className="h-3.5 w-3.5 text-amber-500" />
          <span>74°F • Wind 8mph Safe</span>
        </div>
      </div>

      {/* 3. PRIMARY DISPATCH CTA */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="h-8 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Book Pour Event</span>
        </Button>
      </div>
    </header>
  );
}
