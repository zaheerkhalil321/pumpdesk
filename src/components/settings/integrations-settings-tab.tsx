'use client';

import React, { useState } from 'react';
import {
  FileText,
  Truck,
  Radio,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModalCloseButton } from '@/components/ui/modal-close-button';

export function IntegrationsSettingsTab() {
  const [selectedIntegration, setSelectedIntegration] = useState<{
    title: string;
    category: string;
    description: string;
    details: string[];
  } | null>(null);

  const integrations = [
    {
      id: 'quickbooks',
      title: 'QuickBooks',
      subtitle: 'Accounting',
      badge: 'Coming soon',
      icon: FileText,
      description:
        'Two-way synchronization between PumpDesk completed work tickets and QuickBooks Online invoices.',
      details: [
        'Automatic customer account linking',
        'Direct invoice generation from signed work tickets',
        'Payment status sync back to PumpDesk schedule',
      ],
    },
    {
      id: 'geotab',
      title: 'Geotab',
      subtitle: 'Fleet tracking',
      badge: 'Coming soon',
      icon: Truck,
      description:
        'Hardware telematics integration for live odometer, PTO concrete pump engagement, and real-time GPS locations.',
      details: [
        'Automated en-route and on-site geofence arrival detection',
        'Boom pump PTO engine run-hours recording',
        'Fleet maintenance odometer triggers',
      ],
    },
    {
      id: 'samsara',
      title: 'Samsara',
      subtitle: 'Fleet tracking',
      badge: 'Coming soon',
      icon: Radio,
      description:
        'Cloud fleet telematics and dual dashcam integration for driver safety and exact job site ETA predictions.',
      details: [
        'Real-time traffic-aware ETA to pour locations',
        'Automatic alert when driver is running 10+ minutes late',
        'Pre-trip and post-trip digital DVIR inspection sync',
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Integrations
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Connect your accounting and fleet tools.
        </p>
      </div>

      {/* ── 3 Featured Cards (matches integrations 1.png) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {integrations.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              onClick={() => {
                setSelectedIntegration({
                  title: item.title,
                  category: item.subtitle,
                  description: item.description,
                  details: item.details,
                });
              }}
              className="group rounded-2xl border border-slate-200/90 bg-white p-8 flex flex-col items-center text-center shadow-2xs hover:border-brand/40 hover:shadow-xs transition-all duration-150 cursor-pointer active:scale-[0.99]"
            >
              {/* Large Outline Icon */}
              <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center text-brand border border-slate-200/80 mb-5 group-hover:scale-105 group-hover:bg-brand-light transition-all">
                <Icon className="h-10 w-10 stroke-[1.75]" />
              </div>

              {/* Title & Subtitle */}
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>

              {/* Coming Soon Pill Badge */}
              <div className="mt-6">
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-brand-light group-hover:text-brand group-hover:border-brand/30 transition-colors">
                  {item.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Roadmapped Notice ── */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-slate-600 flex items-center gap-3">
        <Lock className="h-4 w-4 text-slate-400 shrink-0" />
        <span>
          External telematics and QuickBooks two-way synchronization are scheduled for Phase 2 implementation.
        </span>
      </div>

      {/* ── Integration Details Modal ── */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedIntegration.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedIntegration.category} Integration
                </p>
              </div>
              <ModalCloseButton
                onClick={() => setSelectedIntegration(null)}
                size="sm"
              />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedIntegration.description}
            </p>

            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Planned Capabilities
              </h4>
              <ul className="space-y-1.5">
                {selectedIntegration.details.map((d, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                Scheduled for Phase 2
              </span>
              <button
                type="button"
                onClick={() => {
                  toast.success(`Notification set for ${selectedIntegration.title} launch`);
                  setSelectedIntegration(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-brand-hover cursor-pointer"
              >
                Notify Me
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
