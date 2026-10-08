'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  ChevronRight,
  X,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { AppSelect } from '@/components/ui/app-select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOperators } from '@/lib/operators-store';
import { AddOperatorModal } from '@/components/operators/add-operator-modal';

type StatusFilterOption = 'all' | 'Active' | 'Inactive';
type AvailabilityFilterOption = 'all' | 'available' | 'assigned' | 'time_off';

export default function OperatorsPage() {
  const router = useRouter();
  const operators = useOperators();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('Active');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilterOption>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Filtered operators
  const filteredOperators = useMemo(() => {
    return operators.filter((op) => {
      // Status filter
      if (statusFilter !== 'all' && op.status !== statusFilter) return false;

      // Availability filter
      if (availabilityFilter !== 'all' && op.todayStatus.type !== availabilityFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchDigits = q.replace(/\D/g, '');
        const cleanPhone = op.phone.replace(/\D/g, '');
        const matchName = op.name.toLowerCase().includes(q);
        const matchRole = op.role.toLowerCase().includes(q);
        const matchPump = op.defaultPump.toLowerCase().includes(q);
        const matchPhone =
          op.phone.toLowerCase().includes(q) ||
          (searchDigits.length > 2 && cleanPhone.includes(searchDigits));

        if (!matchName && !matchRole && !matchPump && !matchPhone) return false;
      }

      return true;
    });
  }, [operators, statusFilter, availabilityFilter, searchQuery]);

  // Active count
  const activeCount = useMemo(() => {
    return operators.filter((op) => op.status === 'Active').length;
  }, [operators]);

  // Checkbox handlers
  const allSelected =
    filteredOperators.length > 0 &&
    filteredOperators.every((op) => selectedIds.has(op.id));
  const someSelected =
    filteredOperators.some((op) => selectedIds.has(op.id)) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredOperators.map((op) => op.id)));
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

  // Actions
  const handleCopyPhone = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      toast.success('Phone copied to clipboard', { description: `${name}: ${phone}` });
    }
  };

  const handleCall = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation();
    toast.info(`Calling ${name}`, { description: phone });
  };

  const handleText = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation();
    toast.info(`Opening SMS with ${name}`, { description: phone });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full">
      {/* ── 1. Page Header (Figma Image 1) ── */}
      <PageHeader
        title="Operators"
        description="Manage your crew, timesheets, and time off."
        actions={
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add operator</span>
          </Button>
        }
      />

      {/* ── 2. Search & Filters Bar ── */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand transition-colors" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operator name or phone"
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

        {/* Status Dropdown Filter */}
        <div className="w-full sm:w-40 shrink-0">
          <AppSelect
            size="sm"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as StatusFilterOption)}
            options={[
              { value: 'Active', label: 'Status: Active' },
              { value: 'all', label: 'Status: All' },
              { value: 'Inactive', label: 'Status: Inactive' },
            ]}
          />
        </div>

        {/* Availability Dropdown Filter */}
        <div className="w-full sm:w-44 shrink-0">
          <AppSelect
            size="sm"
            value={availabilityFilter}
            onChange={(val) => setAvailabilityFilter(val as AvailabilityFilterOption)}
            options={[
              { value: 'all', label: 'Availability: All' },
              { value: 'available', label: 'Available' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'time_off', label: 'Time off' },
            ]}
          />
        </div>
      </div>

      {/* ── 3. Sub-header line: Counter & Today Availability date ── */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-0.5">
        <span className="font-bold text-slate-900 text-sm">
          {activeCount} active {activeCount === 1 ? 'operator' : 'operators'}
        </span>
        <span className="text-slate-500 text-xs">
          Availability for today &bull; Sep 25, 2026
        </span>
      </div>

      {/* ── 4. Master Operators Table (Figma Image 1) ── */}
      {filteredOperators.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs py-14 px-4 text-center text-slate-400">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No operators found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No matching records found for "${searchQuery}". Check spelling or try a different filter.`
              : 'Try adjusting your filters.'}
          </p>
          {(searchQuery || statusFilter !== 'Active' || availabilityFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('Active');
                setAvailabilityFilter('all');
              }}
              className="mt-3.5 h-8 text-xs font-semibold cursor-pointer"
            >
              Reset filters
            </Button>
          )}
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
                      aria-label="Select all operators"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-3 px-4 w-[24%]">Operator</th>
                  <th className="py-3 px-4 w-[18%]">Phone</th>
                  <th className="py-3 px-4 w-[20%]">Default pump</th>
                  <th className="py-3 px-4 w-[24%]">Today</th>
                  <th className="py-3 px-4 text-left sm:pr-6 w-[14%]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredOperators.map((op) => {
                  const isChecked = selectedIds.has(op.id);
                  const isInactive = op.status === 'Inactive';

                  return (
                    <tr
                      key={op.id}
                      onClick={() => router.push(`/operators/${op.id}`)}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors group cursor-pointer',
                        isChecked ? 'bg-slate-50/60' : '',
                        isInactive ? 'opacity-70 bg-slate-50/30' : ''
                      )}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Select ${op.name}`}
                          checked={isChecked}
                          onCheckedChange={() => handleToggleSelect(op.id)}
                        />
                      </td>

                      {/* 2. Operator Name & Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/operators/${op.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-slate-900 group-hover:text-brand underline underline-offset-2 transition-colors truncate"
                          >
                            {op.name}
                          </Link>
                          <span className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {op.role}
                          </span>
                        </div>
                      </td>

                      {/* 3. Phone */}
                      <td className="py-3.5 px-4 font-normal text-slate-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(e, op.phone, op.name)}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-brand font-mono text-xs cursor-pointer group/phone"
                          title="Click to copy phone"
                        >
                          <span>{op.phone}</span>
                          <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 text-slate-400 transition-opacity" />
                        </button>
                      </td>

                      {/* 4. Default Pump Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/80">
                          {op.defaultPump}
                        </span>
                      </td>

                      {/* 5. Today Availability Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {op.todayStatus.type === 'available' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{op.todayStatus.label}</span>
                          </span>
                        ) : op.todayStatus.type === 'assigned' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                            <span>{op.todayStatus.label}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <span>{op.todayStatus.label}</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Actions Column — Left/Start aligned */}
                      <td
                        className="py-3.5 px-4 text-left sm:pr-6 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-start gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleCall(e, op.phone, op.name)}
                            className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 cursor-pointer shadow-2xs gap-1.5 transition-all"
                            title={`Call ${op.phone}`}
                          >
                            <Phone className="h-3.5 w-3.5 text-brand" />
                            <span>Call</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleText(e, op.phone, op.name)}
                            className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 cursor-pointer shadow-2xs gap-1.5 transition-all"
                            title={`Text ${op.phone}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-brand" />
                            <span>Text</span>
                          </Button>

                          <Link
                            href={`/operators/${op.id}`}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand-light transition-colors ml-0.5"
                            title="View operator profile"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Add Operator Modal ── */}
      <AddOperatorModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}