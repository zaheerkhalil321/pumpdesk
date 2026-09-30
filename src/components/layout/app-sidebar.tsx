'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  FileText,
  Users,
  Contact,
  // Truck,
  // Receipt,
  Settings,
  ChevronDown,
  Check,
  Plus,
  ChevronsLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface YardLocation {
  id: string;
  companyName: string;
  yardName: string;
  code: string;
  location: string;
  isHQ?: boolean;
  pumpCount: number;
}

const dummyYards: YardLocation[] = [
  {
    id: 'yard-1',
    companyName: 'Midcoast Pumping',
    yardName: 'Warren Yard (HQ)',
    code: 'MC',
    location: 'Warren, Maine',
    isHQ: true,
    pumpCount: 4,
  },
  {
    id: 'yard-2',
    companyName: 'Midcoast South',
    yardName: 'Portland Terminal',
    code: 'MS',
    location: 'Portland, Maine',
    pumpCount: 2,
  },
  {
    id: 'yard-3',
    companyName: 'Midcoast North',
    yardName: 'Bangor Staging',
    code: 'MN',
    location: 'Bangor, Maine',
    pumpCount: 1,
  },
];

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isLive?: boolean;
  matchPrefix?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Schedule',
    href: '/schedule',
    icon: Calendar,
    isLive: true,
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: FileText,
    badge: '12',
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
    matchPrefix: true,
  },
  {
    title: 'Contacts',
    href: '/contacts',
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
  const [selectedYard, setSelectedYard] = useState<YardLocation>(dummyYards[0]);
  const [isYardMenuOpen, setIsYardMenuOpen] = useState(false);

  // Keyboard shortcut: Pressing '[' or 'Cmd/Ctrl + B' toggles the sidebar
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (
        e.key === '[' ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b')
      ) {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  return (
    <aside
      className={cn(
        'relative border-r border-slate-200/90 bg-white flex flex-col h-screen select-none shrink-0 justify-between transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-20',
        isCollapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      {/* ── Floating Squircle Border Toggle Button (< >) Exactly As User Requested ── */}
      <button
        type="button"
        onClick={toggleCollapse}
        className="absolute -right-3 top-4.5 h-6 w-6 rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 z-30 cursor-pointer hover:scale-105 active:scale-95"
        title={isCollapsed ? 'Expand sidebar ( [ )' : 'Collapse sidebar ( [ )'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronsLeftRight className="h-3.5 w-3.5 text-slate-700" />
      </button>

      {/* ── Top Area: Brand, Workspace Switcher, Nav Links ── */}
      <div className="flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">
        {/* 1. BRAND HEADER */}
        <div
          className={cn(
            'h-15 flex items-center border-b border-slate-100 transition-all duration-300',
            isCollapsed ? 'justify-center px-2' : 'px-3.5 gap-2.5',
          )}
        >
          {/* Logo Mark: Deep slate squircle with emerald accent */}
          <div className="h-8.5 w-8.5 rounded-[8px] bg-slate-950 flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white/10">
            <span className="font-extrabold text-white text-[17px] tracking-tighter leading-none pl-0.5">
              P<span className="text-emerald-400">.</span>
            </span>
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-[17px] tracking-tight text-slate-900 truncate">
                PumpDesk
              </span>
              <span className="text-[9px] font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                PRO
              </span>
            </div>
          )}
        </div>

        {/* 2. WORKSPACE / BRANCH SELECTOR */}
        <div
          className={cn(
            'mt-3 mb-2 transition-all duration-300',
            isCollapsed ? 'px-2' : 'px-3',
          )}
        >
          <DropdownMenu open={isYardMenuOpen} onOpenChange={setIsYardMenuOpen}>
            <DropdownMenuTrigger
              className={cn(
                'w-full flex items-center rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300 transition-all duration-150 cursor-pointer group text-left shadow-2xs outline-none',
                isCollapsed
                  ? 'h-10 w-10 justify-center p-0 mx-auto'
                  : 'justify-between p-2',
              )}
              title={
                isCollapsed
                  ? `${selectedYard.companyName} (${selectedYard.yardName})`
                  : undefined
              }
            >
              <div
                className={cn(
                  'flex items-center min-w-0',
                  isCollapsed ? 'justify-center' : 'gap-2.5',
                )}
              >
                {/* Monogram Badge */}
                <div className="h-7.5 w-7.5 rounded-[8px] bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 tracking-wider shadow-2xs ring-1 ring-slate-800 transition-colors">
                  {selectedYard.code}
                </div>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-slate-800 truncate group-hover:text-[#0D7A7F] transition-colors leading-tight">
                      {selectedYard.companyName}
                    </p>
                    <p className="text-[10.5px] text-slate-500 truncate leading-tight mt-0.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {selectedYard.yardName}
                    </p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ml-1 ease-out',
                    isYardMenuOpen && 'rotate-180',
                  )}
                />
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-60 p-1.5 rounded-xl shadow-lg border-slate-200"
            >
              <DropdownMenuLabel className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Dispatch Yards
              </DropdownMenuLabel>
              {dummyYards.map((yard) => {
                const isSelected = selectedYard.id === yard.id;
                return (
                  <DropdownMenuItem
                    key={yard.id}
                    onClick={() => {
                      setSelectedYard(yard);
                      toast.success(`Active yard: ${yard.yardName}`, {
                        description: `${yard.companyName} (${yard.location}) • ${yard.pumpCount} pumps assigned`,
                      });
                    }}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors',
                      isSelected
                        ? 'bg-slate-100/90 font-medium text-slate-900'
                        : 'hover:bg-slate-100/60 text-slate-600 hover:text-slate-900',
                    )}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {yard.companyName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {yard.yardName} {yard.isHQ && '• Main HQ'}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-[#0D7A7F] shrink-0 ml-2" />
                    )}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => {
                  toast.info('Add Yard Location', {
                    description:
                      'Yard terminal management is configured in Company Settings.',
                  });
                }}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs text-[#0D7A7F] font-medium hover:bg-[#E6F7F5]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Yard Location
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Section Divider / Label */}
        {!isCollapsed && (
          <div className="px-3.5 pb-1.5 pt-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Dispatch & Ops
            </p>
          </div>
        )}

        {/* 3. NAVIGATION LINKS */}
        <nav
          className={cn(
            'space-y-1 transition-all duration-300',
            isCollapsed ? 'px-2' : 'px-3',
          )}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPrefix
              ? pathname.startsWith(item.href)
              : pathname === item.href;

            if (isCollapsed) {
              /* Collapsed Rail Item with Tooltip */
              return (
                <div key={item.title} className="relative group">
                  <Link
                    href={item.href}
                    className={cn(
                      'h-10 w-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-150 relative',
                      isActive
                        ? 'bg-[#E6F7F5] text-[#0D7A7F] font-semibold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80',
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.isLive && (
                      <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                    {item.badge && !item.isLive && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-slate-400 ring-2 ring-white" />
                    )}
                  </Link>

                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 flex items-center gap-1.5">
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                    {item.isLive && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded">
                        LIVE
                      </span>
                    )}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                </div>
              );
            }

            /* Expanded Nav Item */
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg font-medium transition-all duration-150 group relative px-3 py-2 text-sm overflow-hidden',
                  isActive
                    ? 'bg-[#E6F7F5] text-[#0D7A7F] font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70',
                )}
              >
                {/* Left Active Indicator Bar with Center-Outward Expansion Animation */}
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-[4px] rounded-r-full bg-[#0D7A7F] origin-center animate-expand-vertical" />
                )}

                <Icon
                  className={cn(
                    'h-4.5 w-4.5 shrink-0 transition-colors duration-150 mr-2.5',
                    isActive
                      ? 'text-[#0D7A7F]'
                      : 'text-slate-400 group-hover:text-slate-700',
                  )}
                />
                <span className="truncate">{item.title}</span>

                {/* Badges */}
                {item.isLive && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200/80 px-1.5 py-0.5 rounded-full tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}

                {item.badge && (
                  <span
                    className={cn(
                      'ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                      isActive
                        ? 'bg-[#0D7A7F] text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700',
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

      {/* ── Bottom Portion: User Profile Dock & Quick Settings ── */}
      <div
        className={cn(
          'border-t border-slate-200/80 bg-slate-50/50 transition-all duration-300 shrink-0',
          isCollapsed ? 'p-2 pb-6' : 'p-3 pb-4',
        )}
      >
        {isCollapsed ? (
          /* Collapsed User Dock */
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <Link
                href="/settings"
                className="h-10 w-10 rounded-full bg-[#0D7A7F] text-white font-bold text-xs flex items-center justify-center tracking-wider shadow-2xs hover:ring-2 hover:ring-[#0D7A7F]/40 transition-all relative block"
                aria-label="Jessie Black profile"
              >
                JB
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </Link>
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                Jessie Black (Dispatcher)
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </div>

            <div className="relative group">
              <Link
                href="/settings"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                Settings
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </div>
          </div>
        ) : (
          /* Expanded User Dock */
          <div className="space-y-2">
            <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-200/50 transition-colors group">
              <Link
                href="/settings"
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                {/* Jessie Black Circle Avatar */}
                <div className="relative shrink-0">
                  <div className="h-8.5 w-8.5 rounded-full bg-[#0D7A7F] text-white font-bold text-xs flex items-center justify-center tracking-wider shadow-2xs group-hover:ring-2 group-hover:ring-[#0D7A7F]/40 transition-all">
                    JB
                  </div>
                  {/* Online Green Status Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-800 truncate leading-tight group-hover:text-[#0D7A7F] transition-colors">
                    Jessie Black
                  </p>
                  <p className="text-[10.5px] text-slate-500 truncate leading-tight mt-0.5 flex items-center gap-1">
                    Dispatcher • On Duty
                  </p>
                </div>
              </Link>

              <Link
                href="/settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-all duration-200 hover:rotate-45"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </div>

            {/* Micro Version Meta */}
            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-mono">
              <span>v1.0 Dispatcher</span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white border border-slate-200 px-1 rounded text-[9px]">
                  [
                </kbd>
                <span>toggle</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Linear-Style Edge Interaction Rail (Border Click Target) ── */}
      <div
        onClick={toggleCollapse}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-slate-300/80 active:bg-slate-400 transition-colors z-20"
        title="Toggle sidebar ([)"
      />
    </aside>
  );
}
