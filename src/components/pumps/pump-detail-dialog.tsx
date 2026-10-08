'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Truck,
  User,
  Calendar,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { PumpItem } from '@/lib/pumps-store';

interface PumpDetailDialogProps {
  pump: PumpItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionMode?: boolean;
}

export function PumpDetailDialog({
  pump,
  open,
  onOpenChange,
  inspectionMode = false,
}: PumpDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {pump && (
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200">
          {/* Header - pr-14 ensures cross icon at top-4 right-4 NEVER overlaps badges or text */}
          <div className="p-5 sm:p-6 pr-14 sm:pr-16 bg-slate-50/70 border-b border-slate-100 flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-brand shrink-0 mt-0.5">
              <Truck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">
                  {pump.unitNumber}
                </DialogTitle>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                  {pump.make} {pump.model}
                </span>

                {/* Status Badge - positioned safely away from the close button */}
                {pump.todayStatus.type === 'booked' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                    <span>{pump.todayStatus.label}</span>
                  </span>
                ) : pump.todayStatus.type === 'available' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{pump.todayStatus.label}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>{pump.todayStatus.label}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {pump.typeLabel} &bull; Model Year {pump.year || '2023'}
              </p>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-5 text-xs sm:text-sm">
            {/* Inspection Alert if in Inspection Mode */}
            {inspectionMode && (
              <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 shadow-2xs">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-amber-950 text-xs sm:text-sm">
                    Inspection Due Soon &bull; Action Required
                  </h5>
                  <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                    <strong>{pump.unitNumber}</strong> is scheduled for mandatory DOT inspection on{' '}
                    <strong>{pump.nextInspection.date}</strong>. Ensure rig is available at Warren Yard.
                  </p>
                </div>
              </div>
            )}

            {/* Maintenance Notice if in Maintenance */}
            {pump.inMaintenance && (
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-2.5 text-xs text-amber-950">
                <Wrench className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">In Maintenance</p>
                  <p className="text-amber-800/90 mt-0.5">
                    {pump.maintenanceNote || 'Currently flagged for scheduled maintenance service.'}
                  </p>
                </div>
              </div>
            )}

            {/* Section 1: Specifications */}
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white shadow-2xs space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                <Truck className="h-3.5 w-3.5 text-brand" />
                <span>Rig Specifications</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Boom Reach / Type</span>
                  <span className="font-semibold text-slate-800">{pump.boomLength}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Equipment Type</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {pump.type.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hourly Billing Rate</span>
                  <span className="font-semibold text-slate-800">{pump.hourlyRate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Minimum Callout</span>
                  <span className="font-semibold text-slate-800">{pump.minHours}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Assigned Operator */}
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white shadow-2xs space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                <User className="h-3.5 w-3.5 text-brand" />
                <span>Default Operator Assignment</span>
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs border border-brand/20">
                    {pump.defaultOperator.name.charAt(0)}
                  </div>
                  <div>
                    <Link
                      href={`/operators/${pump.defaultOperator.id}`}
                      className="font-semibold text-slate-900 hover:text-brand hover:underline inline-flex items-center gap-1"
                    >
                      <span>{pump.defaultOperator.name}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </Link>
                    <p className="text-[11px] text-slate-500">{pump.defaultOperator.role}</p>
                  </div>
                </div>

                {pump.defaultOperator.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {pump.defaultOperator.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Section 3: Inspections */}
            <div
              className={`rounded-xl border p-4 bg-white shadow-2xs space-y-3 transition-all ${
                inspectionMode
                  ? 'border-amber-300 ring-2 ring-amber-200/60'
                  : 'border-slate-200/80'
              }`}
            >
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Compliance &amp; Next Inspection</span>
              </h4>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Scheduled Date</span>
                  <span className="font-semibold text-slate-800">{pump.nextInspection.date}</span>
                </div>
                {pump.nextInspection.dueSoon ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    <span>Due soon</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span>Compliant</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <Link
              href="/schedule"
              className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>View on dispatch schedule</span>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs font-semibold cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
