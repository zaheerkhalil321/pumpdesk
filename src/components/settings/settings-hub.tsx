'use client';

import React, { useState } from 'react';
import {
  Building2,
  FileText,
  Bell,
  Puzzle,
  ChevronRight,
  Search,
  Lock,
  Layers,
  Users,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsMainTab } from './settings-theme-bar';
import { toast } from 'sonner';

interface SettingsHubProps {
  onSelectTab: (tab: SettingsMainTab) => void;
}

export function SettingsHub({ onSelectTab }: SettingsHubProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const hubItems = [
    {
      id: 'company' as SettingsMainTab,
      title: 'Company',
      description: 'Details, logo & branches',
      icon: Building2,
      enabled: true,
      badge: null,
    },
    {
      id: 'team_access',
      title: 'Team & access',
      description: 'Users & permissions',
      icon: Users,
      enabled: false,
      badge: 'Phase 2 (Out of Scope)',
    },
    {
      id: 'orders_tickets',
      title: 'Orders & work tickets',
      description: 'Job defaults & ticket requirements',
      icon: CalendarCheck,
      enabled: false,
      badge: 'Phase 2 (Out of Scope)',
    },
    {
      id: 'pricing' as SettingsMainTab,
      title: 'Pricing & billing',
      description: 'Rates, invoices & payments',
      icon: FileText,
      enabled: true,
      badge: null,
    },
    {
      id: 'notifications' as SettingsMainTab,
      title: 'Notifications',
      description: 'Messages & reminders',
      icon: Bell,
      enabled: true,
      badge: null,
    },
    {
      id: 'lists' as SettingsMainTab,
      title: 'Lists & suppliers',
      description: 'Suppliers, pour types & inventory',
      icon: Puzzle,
      enabled: true,
      badge: null,
    },
    {
      id: 'integrations' as SettingsMainTab,
      title: 'Integrations',
      description: 'Accounting & GPS',
      icon: Layers,
      enabled: true,
      badge: null,
    },
  ];

  const filteredItems = hubItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Search Input (matching settings 1.png) ── */}
      <div className="relative max-w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search settings"
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200/90 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Settings Category Grid (matching settings 1.png) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isInteractive = item.enabled;

          return (
            <div
              key={item.title}
              onClick={() => {
                if (isInteractive) {
                  onSelectTab(item.id as SettingsMainTab);
                } else {
                  toast.info(`${item.title} is designated for Phase 2`, {
                    description:
                      'Per platform governance, Team & Access and Work Ticket configuration are out of MVP scope.',
                  });
                }
              }}
              className={cn(
                'group relative rounded-2xl border p-5 transition-all duration-150 flex items-center justify-between gap-4',
                isInteractive
                  ? 'bg-white border-slate-200/90 hover:border-brand/40 hover:shadow-xs hover:bg-slate-50/50 cursor-pointer active:scale-[0.99]'
                  : 'bg-slate-50/60 border-slate-200/60 opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-4 min-w-0">
                {/* Large Icon Box */}
                <div
                  className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors border',
                    isInteractive
                      ? 'bg-brand-light/60 border-brand/20 text-brand group-hover:bg-brand-light'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-brand transition-colors">
                      {item.title}
                    </h3>
                    {item.badge && (
                      <span className="text-[10px] font-semibold bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Right Arrow / Lock */}
              <div className="shrink-0 text-slate-400 group-hover:text-brand transition-colors">
                {isInteractive ? (
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Utility Links (matching settings 1.png) ── */}
      <div className="pt-8 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs text-slate-600">
        <button
          type="button"
          onClick={() => {
            toast.success('Subscription: PumpDesk Pro Unlimited', {
              description:
                'Enterprise fleet tier active for Midcoast Concrete Pumping. Billing renewal: Nov 2026.',
            });
          }}
          className="hover:text-brand hover:underline cursor-pointer font-medium"
        >
          Subscription
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => {
            toast.info('Data Export & Backup', {
              description:
                'Export CSV files of your customers, equipment, and orders anytime from the directory tables.',
            });
          }}
          className="hover:text-brand hover:underline cursor-pointer font-medium"
        >
          Import & export
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => {
            toast.info('Audit Change History', {
              description:
                'All dispatch adjustments and rate modifications are logged with UTC timestamps.',
            });
          }}
          className="hover:text-brand hover:underline cursor-pointer font-medium"
        >
          Change history
        </button>
      </div>
    </div>
  );
}
