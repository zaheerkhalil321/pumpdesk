'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Info,
  ArrowRight,
  X,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { AppSelect } from '@/components/ui/app-select';
import {
  useSettingsStore,
  updateCustomerNotification,
  updateOfficeAlert,
} from '@/lib/settings-store';
import { toast } from 'sonner';

export function NotificationsSettingsTab() {
  const { customerNotifications, officeAlerts } = useSettingsStore();
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'operators' | 'office' | 'templates'>('customers');
  const [activeLatePopover, setActiveLatePopover] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const handleToggleCustomer = (id: string, current: boolean) => {
    updateCustomerNotification(id, { enabled: !current });
    const target = customerNotifications.find((r) => r.id === id);
    toast.success(`${target?.message}: ${!current ? 'Enabled' : 'Disabled'}`);
  };

  const handleToggleOffice = (id: string, current: boolean) => {
    updateOfficeAlert(id, { enabled: !current });
    const target = officeAlerts.find((r) => r.id === id);
    toast.success(`${target?.alert}: ${!current ? 'Enabled' : 'Disabled'}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Sub-tabs Header (Customers, Operators, Office alerts, Templates) ── */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          {[
            { id: 'customers' as const, label: 'Customers' },
            { id: 'operators' as const, label: 'Operators' },
            { id: 'office' as const, label: 'Office alerts' },
            { id: 'templates' as const, label: 'Templates' },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  'pb-3 text-sm font-semibold transition-colors relative cursor-pointer',
                  isActive
                    ? 'text-brand'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: CUSTOMERS (matches settings-notifications 1.png) */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'customers' && (
        <div className="space-y-5">
          <p className="text-xs sm:text-sm text-slate-500">
            Default messages for assigned job contacts.
          </p>

          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold">
                    <th className="py-3 px-4 sm:px-6 w-1/3">Message</th>
                    <th className="py-3 px-4 sm:px-6">When</th>
                    <th className="py-3 px-4 sm:px-6">Channel</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Enabled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerNotifications.map((rule) => (
                    <tr
                      key={rule.id}
                      onClick={() => handleToggleCustomer(rule.id, rule.enabled)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 group-hover:text-brand transition-colors">
                            {rule.message}
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTooltipId(
                                  activeTooltipId === rule.id ? null : rule.id
                                );
                              }}
                              className="text-slate-400 hover:text-brand p-0.5 cursor-pointer"
                              title={rule.info}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                            {activeTooltipId === rule.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-6 top-0 z-30 w-64 p-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl space-y-1.5"
                              >
                                <p className="font-bold">{rule.message}</p>
                                <p className="text-slate-300">{rule.info}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {rule.when}
                      </td>

                      <td
                        className="py-3.5 px-4 sm:px-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AppSelect
                          value={rule.channel}
                          onChange={(val) =>
                            updateCustomerNotification(rule.id, {
                              channel: val as 'Email & text' | 'Text' | 'Email',
                            })
                          }
                          options={[
                            { value: 'Email & text', label: 'Email & text' },
                            { value: 'Text', label: 'Text' },
                            { value: 'Email', label: 'Email' },
                          ]}
                          className="w-44 h-8.5 rounded-lg text-xs"
                        />
                      </td>

                      <td
                        className="py-3.5 px-4 sm:px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() =>
                              handleToggleCustomer(rule.id, rule.enabled)
                            }
                          />
                          <span
                            className={cn(
                              'text-xs font-semibold w-7 text-left',
                              rule.enabled ? 'text-brand' : 'text-slate-400'
                            )}
                          >
                            {rule.enabled ? 'On' : 'Off'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Contact preferences and opt-outs take priority.</span>
            </div>
            <Link
              href="/contacts"
              className="text-brand font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Manage contact preferences</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: OPERATORS (Driver messaging defaults)            */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'operators' && (
        <div className="space-y-5">
          <p className="text-xs sm:text-sm text-slate-500">
            Automated alerts sent directly to concrete pump operators.
          </p>

          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold">
                    <th className="py-3 px-4 sm:px-6 w-1/3">Operator Alert</th>
                    <th className="py-3 px-4 sm:px-6">Timing</th>
                    <th className="py-3 px-4 sm:px-6">Method</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Enabled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    {
                      id: 'op-1',
                      title: 'Daily shift schedule',
                      when: '6:00 PM day prior',
                      channel: 'Text & app notification',
                      enabled: true,
                    },
                    {
                      id: 'op-2',
                      title: 'Live schedule changes',
                      when: 'Instant on dispatch shift edit',
                      channel: 'SMS priority',
                      enabled: true,
                    },
                    {
                      id: 'op-3',
                      title: 'Job site turn-by-turn directions',
                      when: 'When marked en route',
                      channel: 'SMS with GPS link',
                      enabled: true,
                    },
                    {
                      id: 'op-4',
                      title: 'Severe weather rain/frost hold',
                      when: 'Immediately on weather alert',
                      channel: 'SMS emergency',
                      enabled: true,
                    },
                  ].map((rule) => (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 group-hover:text-brand transition-colors">
                        {rule.title}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {rule.when}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {rule.channel}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Switch defaultChecked={rule.enabled} />
                          <span className="text-xs font-semibold w-7 text-left text-brand">
                            On
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 3: OFFICE ALERTS (matches office-alerts 1.png & late)*/}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'office' && (
        <div className="space-y-5">
          <p className="text-xs sm:text-sm text-slate-500">
            Choose which alerts your office receives.
          </p>

          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold">
                    <th className="py-3 px-4 sm:px-5 w-1/4">Alert</th>
                    <th className="py-3 px-4 sm:px-5">When</th>
                    <th className="py-3 px-4 sm:px-5">Notify</th>
                    <th className="py-3 px-4 sm:px-5">Channel</th>
                    <th className="py-3 px-4 sm:px-5 text-right">On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {officeAlerts.map((rule) => {
                    const isLateAlert = rule.id === 'off-1';

                    return (
                      <tr
                        key={rule.id}
                        onClick={() => handleToggleOffice(rule.id, rule.enabled)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        {/* Alert Name + Info Button */}
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 group-hover:text-brand transition-colors">
                              {rule.alert}
                            </span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLateAlert) {
                                    setActiveLatePopover(!activeLatePopover);
                                  } else {
                                    setActiveTooltipId(
                                      activeTooltipId === rule.id ? null : rule.id
                                    );
                                  }
                                }}
                                className="text-slate-400 hover:text-brand p-0.5 cursor-pointer"
                                title="Click for details"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>

                              {/* ── OPERATOR RUNNING LATE POPOVER (operator-late 1.png) ── */}
                              {isLateAlert && activeLatePopover && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute left-0 sm:left-4 top-8 z-40 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-3"
                                >
                                  <div className="flex items-center justify-between pb-1">
                                    <h4 className="font-bold text-sm text-slate-900">
                                      Operator running late
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => setActiveLatePopover(false)}
                                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    Alerts you when ETA exceeds the job&apos;s arrive-by time by your chosen threshold.
                                  </p>

                                  {/* Light Brand Tint Highlight Box */}
                                  <div className="rounded-xl bg-brand-light/70 border border-brand/20 p-3.5 text-xs text-brand space-y-1">
                                    <p className="font-bold">
                                      Arrive by 7:00 AM
                                    </p>
                                    <p className="font-medium text-[11.5px] opacity-90">
                                      10-minute threshold → alert at ETA 7:10 AM or later
                                    </p>
                                  </div>

                                  <p className="text-[11px] text-slate-400 leading-normal">
                                    Uses GPS ETA or an operator-reported delay. Missing location alone won&apos;t trigger an alert.
                                  </p>
                                </div>
                              )}

                              {/* Generic tooltip for other rows */}
                              {!isLateAlert && activeTooltipId === rule.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute left-6 top-0 z-30 w-64 p-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl space-y-1"
                                >
                                  <p className="font-bold">{rule.alert}</p>
                                  <p className="text-slate-300">{rule.info}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* When */}
                        <td
                          className="py-3.5 px-4 sm:px-5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AppSelect
                            value={rule.when}
                            onChange={(val) =>
                              updateOfficeAlert(rule.id, { when: val })
                            }
                            options={[
                              { value: rule.when, label: rule.when },
                              { value: 'Immediately', label: 'Immediately' },
                              { value: '15 min before', label: '15 min before' },
                              { value: '30 min before departure', label: '30 min before departure' },
                              { value: '60 min before arrival', label: '60 min before arrival' },
                              { value: 'ETA 10+ min late', label: 'ETA 10+ min late' },
                              { value: '2 hours after job ends', label: '2 hours after job ends' },
                            ]}
                            className="w-44 h-8.5 rounded-lg text-xs"
                          />
                        </td>

                        {/* Notify */}
                        <td
                          className="py-3.5 px-4 sm:px-5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AppSelect
                            value={rule.notify}
                            onChange={(val) =>
                              updateOfficeAlert(rule.id, { notify: val })
                            }
                            options={[
                              { value: 'Dispatcher', label: 'Dispatcher' },
                              { value: 'Dispatcher + owner', label: 'Dispatcher + owner' },
                              { value: 'Billing', label: 'Billing' },
                            ]}
                            className="w-36 h-8.5 rounded-lg text-xs"
                          />
                        </td>

                        {/* Channel */}
                        <td
                          className="py-3.5 px-4 sm:px-5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AppSelect
                            value={rule.channel}
                            onChange={(val) =>
                              updateOfficeAlert(rule.id, { channel: val as 'In-app + text' | 'In-app' | 'Text' })
                            }
                            options={[
                              { value: 'In-app + text', label: 'In-app + text' },
                              { value: 'In-app', label: 'In-app' },
                              { value: 'Text', label: 'Text' },
                            ]}
                            className="w-36 h-8.5 rounded-lg text-xs"
                          />
                        </td>

                        {/* On Toggle */}
                        <td
                          className="py-3.5 px-4 sm:px-5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() =>
                                handleToggleOffice(rule.id, rule.enabled)
                              }
                            />
                            <span
                              className={cn(
                                'text-xs font-semibold w-7 text-left',
                                rule.enabled ? 'text-brand' : 'text-slate-400'
                              )}
                            >
                              {rule.enabled ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 4: TEMPLATES                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'templates' && (
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand" />
            <h3 className="font-bold text-base text-slate-900">
              Message Templates
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Standard text and email templates sent to job contacts.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-bold text-xs text-slate-800">
                Order Confirmation (SMS)
              </span>
              <p className="text-xs font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                Hi {'{ContactName}'}, Midcoast Pumping has confirmed your pour for {'{PourDate}'} at {'{PourTime}'} with our {'{PumpSize}'} boom pump. Job site: {'{SiteAddress}'}.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-bold text-xs text-slate-800">
                Pump En Route (SMS)
              </span>
              <p className="text-xs font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                Midcoast Concrete Pumping is en route! Operator {'{OperatorName}'} is heading to {'{SiteAddress}'}. ETA: {'{ETA}'}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
