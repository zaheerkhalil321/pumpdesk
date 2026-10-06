'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Calendar,
  FileText,
  Users,
  Settings,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/components/providers/settings-provider';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface YardLocation {
  id: string;
  companyName: string;
  yardName: string;
  code: string;
  location: string;
  isHQ?: boolean;
  pumpCount: number;
}

const DUMMY_YARDS: YardLocation[] = [
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
  badgeType?: 'schedule' | 'count';
  matchPrefix?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Schedule',
    href: '/schedule',
    icon: Calendar,
    badge: '2 today',
    badgeType: 'schedule',
    matchPrefix: true,
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: FileText,
    badge: '12',
    badgeType: 'count',
    matchPrefix: true,
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
    matchPrefix: true,
  },
];

export function MobileNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYard, setSelectedYard] = useState<YardLocation>(DUMMY_YARDS[0]);
  const [isYardMenuOpen, setIsYardMenuOpen] = useState(false);
  const { toggleSettings } = useSettings();

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    toggleSettings();
  };

  return (
    <>
      {/* ── STICKY MOBILE TOP BAR (Only visible on screens < md) ── */}
      <header className="md:hidden sticky top-0 z-40 w-full h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 flex items-center justify-between shadow-2xs select-none shrink-0">
        {/* Left: Hamburger Button & Logo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            className="h-9 w-9 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 shadow-2xs"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/schedule"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            <div className="h-8 w-8 rounded-[8px] bg-brand flex items-center justify-center shadow-xs shrink-0 border border-white/15 transition-colors">
              <span className="font-extrabold text-white text-[16px] tracking-tighter leading-none">
                P
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[16px] tracking-tight text-slate-900">
                PumpDesk
              </span>
              <span className="text-[9px] font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                PRO
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Yard Badge & User Avatar */}
        <div className="flex items-center gap-2">
          {/* Quick Yard Pill */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="truncate max-w-[90px]">{selectedYard.code} HQ</span>
          </button>

          {/* User Profile Avatar (Taps to open Settings) */}
          <button
            type="button"
            onClick={handleOpenSettings}
            title="Open settings"
            aria-label="Open settings"
            className="relative h-8.5 w-8.5 rounded-full bg-slate-900 border border-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-2xs cursor-pointer hover:ring-2 hover:ring-brand/30 transition-all active:scale-95"
          >
            <span>JB</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </button>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OVER DRAWER (SHEET) ── */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[85vw] max-w-xs p-0 bg-white flex flex-col justify-between border-r border-slate-200 h-full overflow-hidden"
        >
          {/* ── Top Scrollable Area ── */}
          <div className="flex-1 overflow-y-auto">
            {/* Header: Brand & Close Button */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <Link
                href="/schedule"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="h-8.5 w-8.5 rounded-[8px] bg-brand flex items-center justify-center shadow-xs shrink-0 border border-white/15 transition-colors">
                  <span className="font-extrabold text-white text-[17px] tracking-tighter leading-none">
                    P
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[17px] tracking-tight text-slate-900">
                    PumpDesk
                  </span>
                  <span className="text-[9px] font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                    PRO
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Yard Selector */}
            <div className="p-3">
              <DropdownMenu
                open={isYardMenuOpen}
                onOpenChange={setIsYardMenuOpen}
              >
                <DropdownMenuTrigger className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 transition-colors cursor-pointer text-left shadow-2xs outline-none">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {selectedYard.code}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {selectedYard.companyName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {selectedYard.yardName}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-64 p-1.5 rounded-xl shadow-lg border-slate-200"
                >
                  <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Dispatch Yards
                  </DropdownMenuLabel>
                  {DUMMY_YARDS.map((yard) => {
                    const isSelected = selectedYard.id === yard.id;
                    return (
                      <DropdownMenuItem
                        key={yard.id}
                        onClick={() => {
                          setSelectedYard(yard);
                          toast.success(`Active yard: ${yard.yardName}`, {
                            description: `${yard.companyName} • ${yard.pumpCount} pumps`,
                          });
                        }}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors',
                          isSelected
                            ? 'bg-slate-100 font-medium text-slate-900'
                            : 'hover:bg-slate-50 text-slate-600',
                        )}
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {yard.companyName}
                          </p>
                          <p className="text-[10.5px] text-slate-500">
                            {yard.yardName}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-brand shrink-0 ml-2" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ── NAVIGATION (Matches Desktop Exactly) ── */}
            <div className="px-3 py-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.matchPrefix
                  ? pathname.startsWith(item.href)
                  : pathname === item.href;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer text-left',
                      isActive
                        ? 'bg-brand-light text-brand font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-brand' : 'text-slate-400',
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>

                    {/* Prominent Badges */}
                    {item.badgeType === 'schedule' ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all shrink-0',
                          isActive
                            ? 'bg-brand text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 border border-slate-200/60',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            isActive
                              ? 'bg-emerald-300 animate-pulse'
                              : 'bg-emerald-500 animate-pulse',
                          )}
                        />
                        <span>{item.badge}</span>
                      </span>
                    ) : item.badge ? (
                      <span
                        className={cn(
                          'text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 transition-colors',
                          isActive
                            ? 'bg-brand text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Bottom Dock: User Profile & Company Settings ── */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
            <div className="flex items-center justify-between">
              {/* User Identity */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-8.5 w-8.5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  JB
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-slate-900 truncate">
                    Jessie Black
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Lead Dispatcher
                  </p>
                </div>
              </div>

              {/* Settings Action Button */}
              <button
                type="button"
                onClick={handleOpenSettings}
                title="Company Settings"
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
