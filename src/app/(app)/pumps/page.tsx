'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Calendar,
  Wrench,
  ArrowRight,
  ChevronRight,
  Info,
  X,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { AppSelect } from '@/components/ui/app-select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import {
  usePumps,
  useMaintenanceRecords,
  PumpItem,
  EquipmentType,
  EquipmentStatus,
  getPumpDisplayName,
} from '@/lib/pumps-store';
import { AddPumpModal } from '@/components/pumps/add-pump-modal';
import { PumpDetailDialog } from '@/components/pumps/pump-detail-dialog';
import { PumpTileCard } from '@/components/pumps/pump-tile-card';

type ViewLayout = 'table' | 'tiles';

export default function PumpsPage() {
  const router = useRouter();
  const pumps = usePumps();
  const maintenanceRecords = useMaintenanceRecords();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [userLayout, setUserLayout] = useState<ViewLayout | null>(null);
  const currentLayout: ViewLayout = userLayout ?? (isMobile || isTablet ? 'tiles' : 'table');

  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'documents'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EquipmentType>('all');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus>('all');
  const [showFilter, setShowFilter] = useState('all');

  // Modals & Dialogs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPumpId, setSelectedPumpId] = useState<string | null>(null);
  const [isInspectionMode, setIsInspectionMode] = useState(false);

  const activePump = useMemo(() => {
    if (!selectedPumpId) return null;
    return pumps.find((p) => p.id === selectedPumpId) || null;
  }, [pumps, selectedPumpId]);

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const maintenanceSectionRef = useRef<HTMLDivElement>(null);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered pumps
  const filteredPumps = useMemo(() => {
    return pumps.filter((p) => {
      // Type filter
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // Show filter from bottom callout
      if (showFilter === 'boom' && p.type !== 'boom_pump') return false;
      if (showFilter === 'line' && p.type !== 'line_pump') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const displayName = getPumpDisplayName(p).toLowerCase();
        const matchUnit = p.unitNumber.toLowerCase().includes(q) || displayName.includes(q);
        const matchMake = p.make.toLowerCase().includes(q);
        const matchModel = p.model.toLowerCase().includes(q);
        const matchOperator = p.defaultOperator.name.toLowerCase().includes(q);
        const matchReach = p.boomLength.toLowerCase().includes(q);
        if (!matchUnit && !matchMake && !matchModel && !matchOperator && !matchReach) {
          return false;
        }
      }

      return true;
    });
  }, [pumps, typeFilter, statusFilter, showFilter, searchQuery]);

  // Counts for alert banner
  const maintenanceCount = useMemo(() => {
    return pumps.filter((p) => p.inMaintenance || p.status === 'maintenance').length;
  }, [pumps]);

  const dueSoonCount = useMemo(() => {
    return pumps.filter((p) => p.nextInspection.dueSoon).length;
  }, [pumps]);

  // Checkbox handlers
  const allSelected =
    filteredPumps.length > 0 &&
    filteredPumps.every((p) => selectedIds.has(p.id));
  const someSelected =
    filteredPumps.some((p) => selectedIds.has(p.id)) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPumps.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenDetail = (pump: PumpItem, inspection = false) => {
    setIsInspectionMode(inspection);
    setSelectedPumpId(pump.id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* ── 1. Page Header (Export removed, V1 Clean) ── */}
      <PageHeader
        title="Pumps"
        description="Manage equipment, availability, and maintenance."
        actions={
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add pump</span>
          </Button>
        }
      />

      {/* ── 2. Pill Tabs (Overview, Maintenance, Documents) ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none',
            activeTab === 'overview'
              ? 'bg-brand text-white shadow-2xs'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
          )}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('maintenance');
            maintenanceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none',
            activeTab === 'maintenance'
              ? 'bg-brand text-white shadow-2xs'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
          )}
        >
          Maintenance
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('documents');
            toast.info('Equipment compliance & inspection certificates', {
              description: 'All 4 DOT safety registrations are currently on file.',
            });
          }}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none',
            activeTab === 'documents'
              ? 'bg-brand text-white shadow-2xs'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
          )}
        >
          Documents
        </button>
      </div>

      {/* ── 3. Alert / Summary Banner ── */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-3 sm:gap-0">
        {/* Left: In Maintenance */}
        <div className="flex items-center justify-between sm:pr-6">
          <div className="flex items-center gap-2.5">
            <Wrench className="h-4 w-4 text-brand shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-slate-800">
              {maintenanceCount} {maintenanceCount === 1 ? 'pump' : 'pumps'} in maintenance
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              maintenanceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              setStatusFilter('maintenance');
            }}
            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View maintenance</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Right: Inspection Due Soon */}
        <div className="flex items-center justify-between sm:pl-6 pt-3 sm:pt-0">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-brand shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-slate-800">
              {dueSoonCount} {dueSoonCount === 1 ? 'inspection' : 'inspections'} due soon
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const pumpDue = pumps.find((p) => p.nextInspection.dueSoon) || pumps[1];
              handleOpenDetail(pumpDue, true);
            }}
            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Review inspection</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── 4. Search & Filters Bar (More filters removed for V1) ── */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand transition-colors" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pump name or unit #"
            className="pl-9.5 pr-14 h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:border-brand outline-none rounded-lg shadow-none transition-all placeholder:text-slate-400"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>

        {/* Controls: Type, Status & View Mode Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 flex-wrap">
          {/* Type Dropdown Filter */}
          <div className="w-full sm:w-44 shrink-0">
            <AppSelect
              size="sm"
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as EquipmentType)}
              options={[
                { value: 'all', label: 'Type: All types' },
                { value: 'boom_pump', label: 'Type: Boom pump' },
                { value: 'line_pump', label: 'Type: Line pump' },
              ]}
            />
          </div>

          {/* Status Dropdown Filter */}
          <div className="w-full sm:w-40 shrink-0">
            <AppSelect
              size="sm"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as EquipmentStatus)}
              options={[
                { value: 'all', label: 'Status: All' },
                { value: 'available', label: 'Status: Available' },
                { value: 'booked', label: 'Status: Booked' },
                { value: 'maintenance', label: 'Status: Maintenance' },
              ]}
            />
          </div>

          {/* View Mode Switcher: Tiles vs Table */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setUserLayout('tiles')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer',
                currentLayout === 'tiles'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Tiles view"
              aria-label="Tiles view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tiles</span>
            </button>
            <button
              type="button"
              onClick={() => setUserLayout('table')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer',
                currentLayout === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Table view"
              aria-label="Table view"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Sub-header line: Counter, View Schedule & Availability Date ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 font-medium px-0.5">
        <span className="font-bold text-slate-900 text-sm">
          {filteredPumps.length} {filteredPumps.length === 1 ? 'pump' : 'pumps'}
        </span>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/schedule')}
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-brand" />
            <span>View schedule</span>
          </Button>
          <span className="text-slate-500 text-xs whitespace-nowrap">
            Availability for today &bull; Sep 25, 2026
          </span>
        </div>
      </div>

      {/* ── 6. Master Pumps Directory (Tiles Grid vs Table) ── */}
      {filteredPumps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs py-14 px-4 text-center text-slate-400">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No pumps found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No matching equipment found for "${searchQuery}". Check spelling or try a different filter.`
              : 'Try adjusting your type or status filters.'}
          </p>
          {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className="mt-3.5 h-8 text-xs font-semibold cursor-pointer"
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : currentLayout === 'tiles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredPumps.map((pump) => (
            <PumpTileCard
              key={pump.id}
              pump={pump}
              onClick={() => handleOpenDetail(pump)}
              onScheduleClick={() => router.push('/schedule')}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold select-none">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-4 w-10">
                    <Checkbox
                      aria-label="Select all pumps"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-3 px-4 w-[22%]">Pump</th>
                  <th className="py-3 px-4 w-[20%]">Type &amp; size</th>
                  <th className="py-3 px-4 w-[20%]">Default operator</th>
                  <th className="py-3 px-4 w-[24%]">Today</th>
                  <th className="py-3 px-4 w-[14%]">Next inspection</th>
                  <th className="py-3 px-4 text-right pr-6 w-10">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPumps.map((pump) => {
                  const isChecked = selectedIds.has(pump.id);

                  return (
                    <tr
                      key={pump.id}
                      onClick={() => handleOpenDetail(pump, false)}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors group cursor-pointer',
                        isChecked ? 'bg-slate-50/60' : ''
                      )}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Select ${pump.unitNumber}`}
                          checked={isChecked}
                          onCheckedChange={() => handleToggleSelect(pump.id)}
                        />
                      </td>

                      {/* 2. Pump Name & Make (Matching Typography) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 group-hover:text-brand underline underline-offset-2 transition-colors truncate text-xs sm:text-sm">
                            {getPumpDisplayName(pump)}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {pump.make}
                          </span>
                        </div>
                      </td>

                      {/* 3. Type & size */}
                      <td className="py-3.5 px-4 font-normal text-slate-700 whitespace-nowrap text-xs sm:text-sm">
                        <span>{pump.typeLabel}</span>
                      </td>

                      {/* 4. Default operator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-slate-900 group-hover:text-brand transition-colors text-xs sm:text-sm">
                            {pump.defaultOperator.name}
                          </span>
                          {pump.defaultOperator.badge && (
                            <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-0.5">
                              {pump.defaultOperator.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Today Availability */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {pump.todayStatus.type === 'booked' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                            <span>{pump.todayStatus.label}</span>
                          </span>
                        ) : pump.todayStatus.type === 'available' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{pump.todayStatus.label}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>{pump.todayStatus.label}</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Next inspection */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start">
                          <span className="text-xs sm:text-sm text-slate-700">{pump.nextInspection.date}</span>
                          {pump.nextInspection.dueSoon && (
                            <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100/90 border border-amber-200/80 px-1.5 py-0.5 rounded-full mt-0.5">
                              Due soon
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Callout Bar */}
          <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-brand shrink-0" />
              <span>Default operators can be changed on individual jobs.</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Show:</span>
                <div className="w-32">
                  <AppSelect
                    size="sm"
                    value={showFilter}
                    onChange={setShowFilter}
                    options={[
                      { value: 'all', label: 'All pumps' },
                      { value: 'boom', label: 'Boom pumps' },
                      { value: 'line', label: 'Line pumps' },
                    ]}
                  />
                </div>
              </div>
              <span className="text-slate-500 whitespace-nowrap">
                Showing all {filteredPumps.length} pumps
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Secondary Section: Maintenance this week (Clickable rows) ── */}
      <div
        ref={maintenanceSectionRef}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Maintenance this week
          </h2>
          <span className="text-xs text-slate-400">
            {maintenanceRecords.length} scheduled event
          </span>
        </div>

        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold select-none">
                  <th className="py-2.5 px-4 w-[24%]">Pump</th>
                  <th className="py-2.5 px-4 w-[24%]">Service</th>
                  <th className="py-2.5 px-4 w-[24%]">Date</th>
                  <th className="py-2.5 px-4 w-[20%]">Status</th>
                  <th className="py-2.5 px-4 text-right pr-6 w-[8%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenanceRecords.map((maint) => {
                  const linkedPump = pumps.find((p) => p.id === maint.pumpId);

                  return (
                    <tr
                      key={maint.id}
                      onClick={() => linkedPump && handleOpenDetail(linkedPump, false)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      {/* Pump */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 group-hover:text-brand underline underline-offset-2 transition-colors text-xs sm:text-sm">
                            {maint.pumpUnit}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            {maint.pumpMake}
                          </span>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3 px-4 text-slate-700 font-medium text-xs sm:text-sm">
                        {maint.service}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 text-xs sm:text-sm">
                        {maint.date}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                          {maint.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right pr-6 whitespace-nowrap">
                        <span className="text-xs font-semibold text-brand group-hover:underline inline-flex items-center gap-1">
                          <span>View details</span>
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 8. Add Pump Modal ── */}
      <AddPumpModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* ── 9. Pump Dossier Detail Dialog ── */}
      <PumpDetailDialog
        key={activePump?.id || 'none'}
        pump={activePump}
        open={!!activePump}
        inspectionMode={isInspectionMode}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPumpId(null);
            setIsInspectionMode(false);
          }
        }}
      />
    </div>
  );
}