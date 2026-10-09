'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  User,
  Calendar,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PumpItem } from '@/lib/pumps-store';

interface PumpTileCardProps {
  pump: PumpItem;
  onClick: () => void;
  onScheduleClick?: () => void;
}

export function PumpTileCard({
  pump,
  onClick,
  onScheduleClick,
}: PumpTileCardProps) {
  const router = useRouter();
  const isMaintenance = pump.inMaintenance || pump.status === 'maintenance';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-brand/40 cursor-pointer overflow-hidden active:scale-[0.99]',
        isMaintenance
          ? 'border-rose-200/80 bg-rose-50/15'
          : 'border-slate-200/90'
      )}
    >
      <div className="p-4 sm:p-4.5 space-y-3">
        {/* Top Header: Truck Icon + Unit Number + Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-2xs',
                isMaintenance
                  ? 'bg-rose-100/70 border border-rose-200 text-rose-700'
                  : 'bg-slate-100 border border-slate-200/90 text-slate-800 group-hover:bg-brand-light group-hover:border-brand/40 group-hover:text-brand'
              )}
            >
              <Truck className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors truncate">
                {pump.unitNumber}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {pump.make} {pump.model} {pump.year ? `(${pump.year})` : ''}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {pump.todayStatus.type === 'booked' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                <span>Booked</span>
              </span>
            ) : pump.todayStatus.type === 'available' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>Available</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>Maintenance</span>
              </span>
            )}
          </div>
        </div>

        {/* Equipment Specifications & Operator */}
        <div className="space-y-2 pt-1 text-xs">
          {/* Boom Reach / Type & Hourly Rate */}
          <div className="flex items-center justify-between text-xs">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60 truncate max-w-[170px]">
              {pump.boomLength || pump.typeLabel}
            </span>
            <span className="text-[11.5px] text-slate-600 font-mono font-semibold">
              {pump.hourlyRate}
            </span>
          </div>

          {/* Default Operator */}
          <div className="flex items-center justify-between gap-2 text-xs pt-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-slate-700 truncate min-w-0">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                {pump.defaultOperator.name}
              </span>
              <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                &bull; {pump.defaultOperator.role}
              </span>
            </div>
            {pump.defaultOperator.badge && (
              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/70">
                {pump.defaultOperator.badge}
              </span>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-600 pt-0.5 truncate">
            <Calendar className="h-3.5 w-3.5 text-brand shrink-0" />
            <span className="truncate">{pump.todayStatus.label}</span>
          </div>

          {/* Next Inspection */}
          <div className="flex items-center justify-between text-[11px] pt-0.5 text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Wrench className="h-3 w-3 text-slate-400 shrink-0" />
              <span>Inspection:</span>
            </div>
            <span
              className={cn(
                'font-medium',
                pump.nextInspection.dueSoon
                  ? 'text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60'
                  : 'text-slate-700'
              )}
            >
              {pump.nextInspection.date}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (onScheduleClick) {
                onScheduleClick();
              } else {
                router.push('/schedule');
              }
            }}
            className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
          >
            <Calendar className="h-3 w-3 text-brand" />
            <span>Schedule</span>
          </Button>
        </div>

        <div className="text-xs font-bold text-slate-700 group-hover:text-brand transition-colors inline-flex items-center gap-1">
          <span>View specs</span>
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
