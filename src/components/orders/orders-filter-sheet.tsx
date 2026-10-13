'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { ModalCloseButton } from '@/components/ui/modal-close-button';
import { Button } from '@/components/ui/button';
import {
  SlidersHorizontal,
  Check,
  RotateCcw,
  X,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type OrderTab = 'all' | 'confirmed' | 'pending' | 'needs_assignment' | 'ready_to_invoice';

interface OrdersFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
  sortOrder: 'desc' | 'asc';
  onSortChange: (sort: 'desc' | 'asc') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  confirmedCount: number;
  pendingCount: number;
  needsAssignmentCount: number;
  readyToInvoiceCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function OrdersFilterSheet({
  isOpen,
  onOpenChange,
  activeTab,
  onTabChange,
  sortOrder,
  onSortChange,
  searchQuery,
  onSearchChange,
  totalCount,
  confirmedCount,
  pendingCount,
  needsAssignmentCount,
  readyToInvoiceCount,
  filteredCount,
  onResetFilters,
}: OrdersFilterSheetProps) {
  const isFiltered = activeTab !== 'all' || searchQuery.trim() !== '' || sortOrder !== 'desc';

  const statusOptions: { id: OrderTab; label: string; count: number; dotColor: string }[] = [
    { id: 'all', label: 'All Orders', count: totalCount, dotColor: 'bg-slate-400' },
    { id: 'confirmed', label: 'Confirmed', count: confirmedCount, dotColor: 'bg-brand' },
    { id: 'pending', label: 'Pending', count: pendingCount, dotColor: 'bg-amber-500' },
    { id: 'needs_assignment', label: 'Needs Assignment', count: needsAssignmentCount, dotColor: 'bg-rose-500' },
    { id: 'ready_to_invoice', label: 'Ready to Invoice', count: readyToInvoiceCount, dotColor: 'bg-slate-500' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-2xl max-h-[85vh] p-0 bg-white flex flex-col overflow-hidden border-t border-slate-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand" />
            <span className="font-bold text-sm text-slate-900">
              Filter Orders
            </span>
            {isFiltered && (
              <span className="text-[10px] font-bold bg-brand text-white px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
            <ModalCloseButton
              onClick={() => onOpenChange(false)}
              size="sm"
            />
          </div>
        </div>

        {/* Scrollable Filter Body */}
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* 1. Quick Search */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Search Jobs
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Order #, customer, address, pump..."
                className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand focus:bg-white shadow-2xs transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Status Category */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
              Status Category
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {statusOptions.map((opt) => {
                const isSelected = activeTab === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onTabChange(opt.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left',
                      isSelected
                        ? 'border-brand bg-brand/5 text-brand shadow-xs'
                        : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dotColor)} />
                      <span className={isSelected ? 'font-bold' : 'font-medium'}>
                        {opt.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold',
                        isSelected ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-600'
                      )}>
                        {opt.count}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-brand" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Sort Order */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <span>Sort By</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSortChange('desc')}
                className={cn(
                  'px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center',
                  sortOrder === 'desc'
                    ? 'border-brand bg-brand/5 text-brand font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                Date (Newest first)
              </button>
              <button
                type="button"
                onClick={() => onSortChange('asc')}
                className={cn(
                  'px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center',
                  sortOrder === 'asc'
                    ? 'border-brand bg-brand/5 text-brand font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                Date (Oldest first)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Apply Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Button
            type="button"
            variant="brand"
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-xl font-bold text-xs gap-1.5 shadow-2xs"
          >
            <Check className="h-4 w-4" />
            <span>Show {filteredCount} {filteredCount === 1 ? 'Order' : 'Orders'}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
