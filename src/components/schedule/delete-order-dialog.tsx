'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, MapPin, Truck, Clock, X } from 'lucide-react';
import { ScheduleBooking } from './schedule-types';

interface DeleteOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: ScheduleBooking | null;
  onConfirmDelete: () => void;
}

export function DeleteOrderDialog({
  isOpen,
  onOpenChange,
  booking,
  onConfirmDelete,
}: DeleteOrderDialogProps) {
  if (!booking) return null;

  const handleConfirm = () => {
    onConfirmDelete();
    onOpenChange(false);
  };

  const startHour = booking.startHour ?? 7;
  const hourLabel =
    startHour === 12
      ? '12:00 PM'
      : startHour < 12
      ? `${startHour}:00 AM`
      : `${startHour - 12}:00 PM`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] p-6 rounded-2xl bg-white gap-5 border border-slate-200/90 shadow-2xl overflow-hidden"
      >
        {/* Top Header with Warning Icon & Close Button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-red-50 border border-red-200/70 flex items-center justify-center shrink-0 text-red-600 shadow-2xs">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Delete Order {booking.orderNumber || 'ORD'}?
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogClose className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer outline-none shrink-0">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        {/* Order Details Context Card */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm truncate">
              {booking.customerName || 'Customer'}
            </span>
            <span className="font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] shadow-2xs shrink-0">
              {booking.volumeYards || 120} yd³
            </span>
          </div>

          <div className="space-y-1 text-slate-600">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{booking.jobSiteName || 'Site Location'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>
                Pour at {hourLabel} ({booking.durationHours || 3}h duration)
              </span>
            </div>

            {booking.operator && (
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Operator: {booking.operator}</span>
              </div>
            )}
          </div>
        </div>

        {/* Caution Banner */}
        <div className="p-3 rounded-xl bg-red-50/60 border border-red-200/70 flex items-start gap-2.5 text-xs text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Deleting this order will remove it from the schedule board and release the assigned pump slot.
          </p>
        </div>

        {/* Actions: Cancel + Confirm Delete */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Keep order
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all gap-1.5 cursor-pointer active:scale-98"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete order</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
