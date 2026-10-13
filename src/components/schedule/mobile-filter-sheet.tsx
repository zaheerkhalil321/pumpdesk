'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { ModalCloseButton } from '@/components/ui/modal-close-button';
import { Button } from '@/components/ui/button';
import { AppSelect } from '@/components/ui/app-select';
import { Search, X, SlidersHorizontal, Check, RotateCcw } from 'lucide-react';
import { PumpLane } from './schedule-types';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pumps: PumpLane[];
  selectedPumpId: string;
  onSelectPump: (pumpId: string) => void;
  operators: string[];
  selectedOperator: string;
  onSelectOperator: (operator: string) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
}

export function MobileFilterSheet({
  isOpen,
  onOpenChange,
  searchQuery,
  onSearchChange,
  pumps,
  selectedPumpId,
  onSelectPump,
  operators,
  selectedOperator,
  onSelectOperator,
  onResetFilters,
  activeFilterCount,
}: MobileFilterSheetProps) {
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
              Filter Schedule
            </span>
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-bold bg-brand text-white px-2 py-0.5 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
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

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* 1. Search Query */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Search Jobs
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search order #, customer, address..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Pump Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Assigned Rig / Pump
            </label>
            <AppSelect
              value={selectedPumpId}
              onChange={onSelectPump}
              options={[
                { value: 'all', label: 'All pumps (Complete Fleet)' },
                ...pumps.map((p) => ({
                  value: p.id,
                  label: `${p.code} • ${p.name}`,
                })),
              ]}
              className="h-10 text-xs font-medium"
            />
          </div>

          {/* 3. Operator Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Operator
            </label>
            <AppSelect
              value={selectedOperator}
              onChange={onSelectOperator}
              options={[
                { value: 'all', label: 'All operators (Entire Crew)' },
                ...operators.map((op) => ({
                  value: op,
                  label: op,
                })),
              ]}
              className="h-10 text-xs font-medium"
            />
          </div>
        </div>

        {/* Footer Apply Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Button
            type="button"
            variant="brand"
            onClick={() => onOpenChange(false)}
            className="w-full h-10 rounded-xl font-semibold text-xs gap-1.5 shadow-2xs"
          >
            <Check className="h-4 w-4" />
            <span>Apply Filters ({filteredCountText(activeFilterCount)})</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function filteredCountText(count: number): string {
  if (count === 0) return 'All Jobs';
  if (count === 1) return '1 Active';
  return `${count} Active`;
}
