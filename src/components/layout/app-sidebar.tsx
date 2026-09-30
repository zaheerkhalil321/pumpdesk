"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileText,
  Users,
  Contact,
  // Truck,
  // Receipt,
  Settings,
  ChevronDown,
  ChevronLeft,
  Check,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  matchPrefix?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Schedule",
    href: "/schedule",
    icon: Calendar,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: FileText,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    matchPrefix: true,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Contact,
  },
  /*
  // Tabs below contacts commented out as requested:
  {
    title: "Pumps & Operators",
    href: "/pumps",
    icon: Truck,
  },
  {
    title: "Tickets & Billing",
    href: "/invoices",
    icon: Receipt,
  },
  */
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative border-r border-border bg-card flex flex-col h-screen select-none shrink-0 justify-between transition-all duration-300 ease-in-out z-20",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* ── Floating Minimize / Expand Arrow Button ── */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-background shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 z-30 cursor-pointer hover:scale-105 active:scale-95"
        )}
        title={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
        aria-label={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
      >
        <ChevronLeft
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300 ease-in-out",
            isCollapsed && "rotate-180"
          )}
        />
      </button>

      {/* Top Portion: Logo, Company Switcher, Navigation */}
      <div className="flex flex-col">
        {/* 1. BRAND HEADER */}
        <div
          className={cn(
            "h-16 flex items-center transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "px-5 gap-3"
          )}
        >
          {/* Logo Mark: Squircle with bold P and vibrant green accent dot */}
          <div className="h-9 w-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white/10">
            <span className="font-extrabold text-white text-lg tracking-tighter leading-none pl-0.5">
              P<span className="text-emerald-400">.</span>
            </span>
          </div>

          {!isCollapsed && (
            <div className="flex items-baseline gap-1.5 overflow-hidden transition-all duration-300">
              <span className="font-bold text-[19px] tracking-tight text-foreground truncate">
                PumpDesk
              </span>
            </div>
          )}
        </div>

        {/* 2. COMPANY / BRANCH SWITCHER */}
        <div className={cn("mb-3 transition-all duration-300", isCollapsed ? "px-2" : "px-3.5")}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "w-full flex items-center rounded-xl border border-border/80 bg-background/50 hover:bg-muted/50 hover:border-border transition-all duration-150 cursor-pointer group text-left shadow-2xs outline-none",
                isCollapsed
                  ? "h-11 w-11 justify-center p-0 mx-auto"
                  : "justify-between p-2.5"
              )}
              title={isCollapsed ? "Midcoast Pumping (Warren, Maine)" : undefined}
            >
              <div className={cn("flex items-center min-w-0", isCollapsed ? "justify-center" : "gap-3")}>
                {/* Circle Avatar with MC */}
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 tracking-wider">
                  MC
                </div>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-foreground truncate group-hover:text-[#0D7A7F] transition-colors leading-tight">
                      Midcoast Pumping
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                      Warren, Maine
                    </p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0 ml-1" />
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56 p-1.5 rounded-xl shadow-lg border-border">
              <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                Operational Yard Locations
              </DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center justify-between p-2 rounded-lg cursor-pointer bg-muted/60 font-medium text-xs">
                <div>
                  <p className="font-semibold text-foreground">Midcoast Pumping</p>
                  <p className="text-[11px] text-muted-foreground">Warren Yard (Main HQ)</p>
                </div>
                <Check className="h-4 w-4 text-[#0D7A7F]" />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground">
                <div>
                  <p className="font-medium">Midcoast South</p>
                  <p className="text-[11px] text-muted-foreground">Portland Terminal</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs text-[#0D7A7F] font-medium hover:bg-[#E6F7F5]">
                <Plus className="h-3.5 w-3.5" />
                Add Yard Location
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 3. NAVIGATION LINKS */}
        <nav className={cn("space-y-1 transition-all duration-300", isCollapsed ? "px-2" : "px-3")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPrefix
              ? pathname.startsWith(item.href)
              : pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-xl font-medium transition-all duration-150 group relative",
                  isCollapsed
                    ? "h-11 w-11 justify-center mx-auto"
                    : "gap-3 px-3.5 py-2.5 text-sm",
                  isActive
                    ? "bg-[#E6F7F5] text-[#0D7A7F] font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
                )}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors duration-150",
                    isActive
                      ? "text-[#0D7A7F]"
                      : "text-slate-500 group-hover:text-slate-900"
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.title}</span>}

                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      "ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                      isActive
                        ? "bg-[#0D7A7F] text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Portion: User Profile Dock & Version Footer */}
      <div
        className={cn(
          "border-t border-border/80 transition-all duration-300",
          isCollapsed ? "p-2" : "p-3.5"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-xl hover:bg-muted/40 transition-colors",
            isCollapsed ? "justify-center p-1" : "justify-between p-2"
          )}
        >
          <Link
            href="/settings"
            className={cn("flex items-center min-w-0 group", isCollapsed ? "justify-center" : "gap-2.5")}
            title={isCollapsed ? "Jessie Black (Dispatcher) - Settings" : undefined}
          >
            {/* Jessie Black Circle Avatar */}
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-[#0D7A7F] text-white font-bold text-xs flex items-center justify-center tracking-wider shadow-2xs group-hover:ring-2 group-hover:ring-[#0D7A7F]/40 transition-all">
                JB
              </div>
              {/* Online Green Status Indicator */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-semibold text-xs text-foreground truncate leading-tight group-hover:text-[#0D7A7F] transition-colors">
                  Jessie Black
                </p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  Dispatcher
                </p>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <Link
              href="/settings"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 hover:rotate-45"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          )}
        </div>

        {/* Version Footer */}
        {!isCollapsed && (
          <p className="text-[11px] text-muted-foreground/60 font-mono tracking-wider px-2 pt-2 text-left transition-opacity duration-300">
            v1.0 PumpDesk 2026
          </p>
        )}
      </div>
    </aside>
  );
}
