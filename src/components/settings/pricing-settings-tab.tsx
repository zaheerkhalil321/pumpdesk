'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Info,
  ArrowRight,
  Receipt,
  CreditCard,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useSettingsStore,
  PricingService,
  AdditionalCharge,
  addPricingService,
  updatePricingService,
  addAdditionalCharge,
  updateAdditionalCharge,
} from '@/lib/settings-store';
import { toast } from 'sonner';

export function PricingSettingsTab() {
  const { services, charges } = useSettingsStore();
  const [activeSubTab, setActiveSubTab] = useState<'services' | 'invoice' | 'payment'>('services');
  const [searchQuery, setSearchQuery] = useState('');

  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleSubTabChange = (tabId: 'services' | 'invoice' | 'payment') => {
    setActiveSubTab(tabId);
  };

  useEffect(() => {
    const nav = navRef.current;
    const button = tabRefs.current[activeSubTab];
    if (nav && button) {
      const buttonRect = button.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      const navCenter = navRect.left + navRect.width / 2;
      nav.scrollBy({
        left: buttonCenter - navCenter,
        behavior: 'smooth',
      });
    }
  }, [activeSubTab]);

  // Modals
  const [editingService, setEditingService] = useState<PricingService | null>(null);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceRate, setNewServiceRate] = useState('275');
  const [newServiceMin, setNewServiceMin] = useState('4 hours');

  const [editingCharge, setEditingCharge] = useState<AdditionalCharge | null>(null);
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false);
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeRate, setNewChargeRate] = useState('50');
  const [newChargeUnit, setNewChargeUnit] = useState('Per hour');

  const filteredServices = services.filter((s) => {
    if (!searchQuery.trim()) return true;
    return s.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredCharges = charges.filter((c) => {
    if (!searchQuery.trim()) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSaveServiceEdit = () => {
    if (!editingService) return;
    updatePricingService(editingService.id, {
      name: editingService.name,
      rate: Number(editingService.rate),
      minimum: editingService.minimum,
    });
    toast.success(`Updated rate for ${editingService.name}`, {
      description: `$${editingService.rate} / hr (${editingService.minimum} minimum)`,
    });
    setEditingService(null);
  };

  const handleCreateService = () => {
    if (!newServiceName.trim()) return;
    addPricingService({
      name: newServiceName.trim(),
      rate: Number(newServiceRate) || 200,
      rateUnit: '/ hour',
      minimum: newServiceMin || '4 hours',
      status: 'Active',
    });
    toast.success(`Service added: ${newServiceName}`);
    setIsAddServiceOpen(false);
    setNewServiceName('');
  };

  const handleSaveChargeEdit = () => {
    if (!editingCharge) return;
    updateAdditionalCharge(editingCharge.id, {
      name: editingCharge.name,
      rate: Number(editingCharge.rate),
      unit: editingCharge.unit,
    });
    toast.success(`Updated charge for ${editingCharge.name}`);
    setEditingCharge(null);
  };

  const handleCreateCharge = () => {
    if (!newChargeName.trim()) return;
    addAdditionalCharge({
      name: newChargeName.trim(),
      rate: Number(newChargeRate) || 50,
      unit: newChargeUnit || 'Per job',
      status: 'Active',
    });
    toast.success(`Additional charge added: ${newChargeName}`);
    setIsAddChargeOpen(false);
    setNewChargeName('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Sub-tabs Navigation Bar ── */}
      <div className="border-b border-slate-200/90 pb-0">
        <div className="flex items-center justify-between gap-4">
          <nav
            ref={navRef}
            className="flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none scroll-smooth -mb-px py-1"
          >
            {[
              { id: 'services' as const, label: 'Services & rates' },
              { id: 'invoice' as const, label: 'Invoice settings' },
              { id: 'payment' as const, label: 'Payment settings' },
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  type="button"
                  onClick={() => handleSubTabChange(tab.id)}
                  className={cn(
                    'pb-3 pt-1 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer shrink-0 whitespace-nowrap',
                    isActive
                      ? 'text-brand'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full transition-all" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop/Tablet Action Button */}
          {activeSubTab === 'services' && (
            <div className="hidden sm:flex items-center pb-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add service</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: SERVICES & RATES (matches settings-pricing 1.png)*/}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'services' && (
        <div className="space-y-6">
          {/* Search bar & Mobile Action Bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services or charges"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand shadow-2xs"
              />
            </div>

            {/* Mobile Action Button: sleek, compact, elegant, right beside the search bar */}
            <button
              type="button"
              onClick={() => setIsAddServiceOpen(true)}
              className="sm:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add service</span>
            </button>
          </div>

          {/* Card 1: Pump services Table */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900">
                  Pump services
                </h3>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Sample rates
                </span>
              </div>
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setEditingService(service)}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2.5 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {service.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {service.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      ${service.rate} {service.rateUnit}
                    </span>
                    <span className="text-slate-500">
                      {service.minimum} minimum
                    </span>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingService(service);
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      Manage rate
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[550px]">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold">
                    <th className="py-3 px-4 sm:px-5">Service</th>
                    <th className="py-3 px-4 sm:px-5">Rate</th>
                    <th className="py-3 px-4 sm:px-5">Minimum</th>
                    <th className="py-3 px-4 sm:px-5">Status</th>
                    <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServices.map((service) => (
                    <tr
                      key={service.id}
                      onClick={() => setEditingService(service)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-semibold text-slate-900 group-hover:text-brand transition-colors">
                        {service.name}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 font-medium text-slate-800">
                        ${service.rate} {service.rateUnit}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-slate-600">
                        {service.minimum}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {service.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingService(service);
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
              Billing services set the rate. Assigned pumps are managed in{' '}
              <Link href="/pumps" className="text-brand font-semibold hover:underline">
                Pumps
              </Link>
              .
            </div>
          </div>

          {/* Card 2: Additional charges Table */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                Additional charges
              </h3>
              <button
                type="button"
                onClick={() => setIsAddChargeOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5 text-slate-500" />
                Add charge
              </button>
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredCharges.map((charge) => (
                <div
                  key={charge.id}
                  onClick={() => setEditingCharge(charge)}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {charge.name}
                    </span>
                    <span className="font-bold text-sm text-slate-800">
                      ${charge.rate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{charge.unit}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCharge(charge);
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold">
                    <th className="py-3 px-4 sm:px-5">Charge</th>
                    <th className="py-3 px-4 sm:px-5">Rate</th>
                    <th className="py-3 px-4 sm:px-5">Unit</th>
                    <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCharges.map((charge) => (
                    <tr
                      key={charge.id}
                      onClick={() => setEditingCharge(charge)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-semibold text-slate-900 group-hover:text-brand transition-colors">
                        {charge.name}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 font-medium text-slate-800">
                        ${charge.rate}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-slate-600">
                        {charge.unit}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCharge(charge);
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Alert Callout (matches settings-pricing 1.png) */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Info className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Customer-specific rates are managed on the customer account.</span>
              </div>
              <Link
                href="/customers"
                className="text-brand font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Open Customers</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: INVOICE SETTINGS                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'invoice' && (
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand" />
            <h3 className="font-bold text-base text-slate-900">
              Default Invoice & Billing Terms
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Payment Terms
              </label>
              <input
                type="text"
                defaultValue="Net 30"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default State Tax Rate (%)
              </label>
              <input
                type="text"
                defaultValue="5.5%"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                defaultValue="INV-"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Billing Contact Email
              </label>
              <input
                type="email"
                defaultValue="billing@midcoast.example"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 3: PAYMENT SETTINGS                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'payment' && (
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand" />
            <h3 className="font-bold text-base text-slate-900">
              Payment & Remittance
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Remittance instructions printed on customer invoices and statement summaries.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Remit Checks To
              </label>
              <input
                type="text"
                defaultValue="Midcoast Concrete Pumping LLC, PO Box 412, Warren, ME 04864"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Accepted Payment Methods
              </label>
              <input
                type="text"
                defaultValue="ACH Direct Deposit, Check, Wire Transfer"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Service ── */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Manage Service Rate
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate ($ / hr)
                  </label>
                  <input
                    type="number"
                    value={editingService.rate}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        rate: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Hours
                  </label>
                  <input
                    type="text"
                    value={editingService.minimum}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        minimum: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveServiceEdit}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-brand-hover cursor-pointer"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Service ── */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Add Pump Service
              </h3>
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. 52m Boom Pump"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate ($ / hr)
                  </label>
                  <input
                    type="number"
                    value={newServiceRate}
                    onChange={(e) => setNewServiceRate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum
                  </label>
                  <input
                    type="text"
                    value={newServiceMin}
                    onChange={(e) => setNewServiceMin(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateService}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-brand-hover cursor-pointer"
              >
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Charge ── */}
      {editingCharge && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Manage Additional Charge
              </h3>
              <button
                type="button"
                onClick={() => setEditingCharge(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Charge Name
                </label>
                <input
                  type="text"
                  value={editingCharge.name}
                  onChange={(e) =>
                    setEditingCharge({ ...editingCharge, name: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate ($)
                  </label>
                  <input
                    type="number"
                    value={editingCharge.rate}
                    onChange={(e) =>
                      setEditingCharge({
                        ...editingCharge,
                        rate: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editingCharge.unit}
                    onChange={(e) =>
                      setEditingCharge({
                        ...editingCharge,
                        unit: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCharge(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChargeEdit}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-brand-hover cursor-pointer"
              >
                Save Charge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Charge ── */}
      {isAddChargeOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Add Additional Charge
              </h3>
              <button
                type="button"
                onClick={() => setIsAddChargeOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Charge Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekend Pour Surcharge"
                  value={newChargeName}
                  onChange={(e) => setNewChargeName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate ($)
                  </label>
                  <input
                    type="number"
                    value={newChargeRate}
                    onChange={(e) => setNewChargeRate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newChargeUnit}
                    onChange={(e) => setNewChargeUnit(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddChargeOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCharge}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-brand-hover cursor-pointer"
              >
                Add Charge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
