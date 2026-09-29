"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Truck,
  Users2,
  Building2,
  Contact2,
  Receipt,
  Settings,
  Flame,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "active" | "neutral";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: "DISPATCH & FLEET",
    items: [
      {
        title: "Schedule",
        href: "/schedule",
        icon: CalendarDays,
        badge: "8 Live",
        badgeVariant: "active",
      },
      {
        title: "Pour Orders",
        href: "/orders",
        icon: ClipboardList,
      },
      {
        title: "Pumps & Fleet",
        href: "/pumps",
        icon: Truck,
        badge: "15",
        badgeVariant: "neutral",
      },
      {
        title: "Crew & Operators",
        href: "/operators",
        icon: Users2,
      },
    ],
  },
  {
    title: "CRM & ACCOUNTS",
    items: [
      {
        title: "Customers",
        href: "/customers",
        icon: Building2,
      },
      {
        title: "Contacts & Supers",
        href: "/contacts",
        icon: Contact2,
      },
    ],
  },
  {
    title: "FINANCE & ADMIN",
    items: [
      {
        title: "Tickets & Billing",
        href: "/invoices",
        icon: Receipt,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col h-screen select-none shrink-0">
      {/* 1. WORKSPACE HEADER */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            <Flame className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground tracking-tight leading-tight">
              Midcoast Pumping
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dallas Metro Yard
            </span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORIZED NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 text-[10.5px] font-bold text-muted-foreground tracking-wider uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/schedule" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors",
                      isActive
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-muted-foreground"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          item.badgeVariant === "active"
                            ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* 3. LIVE ON-DUTY CREW WIDGET */}
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              On-Duty Rig Crew
            </span>
            <span className="text-[10px] font-bold text-foreground">4 Active</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Jake Miller</span>
              <span className="text-foreground font-mono font-medium">38M Putz</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Carlos Rodriguez</span>
              <span className="text-foreground font-mono font-medium">32M Schwing</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Dave Smith</span>
              <span className="text-foreground font-mono font-medium">47M Putz</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. USER PROFILE DOCK */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
            JB
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground truncate">
              Jessie Black
            </span>
            <span className="text-[10.5px] text-muted-foreground truncate">
              Chief Dispatcher • Midcoast
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
