'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  X,
  ArrowUpRight,
  User,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { ScheduleBooking, PumpLane } from './schedule-types';
import { toast } from 'sonner';

interface OrderDossierModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: ScheduleBooking | null;
  pumps: PumpLane[];
  onQuickEdit?: (booking: ScheduleBooking) => void;
}

export function OrderDossierModal({
  isOpen,
  onOpenChange,
  booking,
  pumps,
  onQuickEdit,
}: OrderDossierModalProps) {
  if (!booking) return null;

  const assignedPump = pumps.find((p) => p.id === booking.pumpId);
  const operatorName = assignedPump?.operator || 'Rob Black';
  const pumpCode = assignedPump?.code || '01 – 34M';

  // Format Times based on booking start hour
  const startHour = booking.startHour || 7.5;
  const pourHour = Math.floor(startHour);
  const pourMinutes = Math.round((startHour - pourHour) * 60);
  const pourTimeStr = `${pourHour <= 12 ? pourHour : pourHour - 12}:${
    pourMinutes === 0 ? '00' : pourMinutes
  } ${pourHour >= 12 ? 'PM' : 'AM'}`;

  // Arrive by: 30 minutes before pour time
  const arriveHour = pourMinutes >= 30 ? pourHour : pourHour - 1;
  const arriveMin = pourMinutes >= 30 ? pourMinutes - 30 : pourMinutes + 30;
  const arriveTimeStr = `${arriveHour <= 12 ? arriveHour : arriveHour - 12}:${
    arriveMin === 0 ? '00' : arriveMin
  } ${arriveHour >= 12 ? 'PM' : 'AM'}`;

  // Status mapping
  const isEnRoute = booking.status === 'travel';
  const isOnSite = booking.status === 'onsite';

  const statusText = isOnSite
    ? 'On site • Pumping'
    : isEnRoute
    ? 'En route • On time'
    : 'Scheduled • Confirmed';

  const statusEta = isOnSite ? 'Finish ~11:30 AM' : 'ETA 6:52 AM';

  const handleCall = (name: string, phone: string) => {
    toast.info(`Calling ${name}`, { description: phone });
  };

  const handleText = (name: string, phone: string) => {
    toast.info(`Messaging ${name}`, { description: phone });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[410px] p-5 rounded-2xl bg-white gap-4 border border-slate-200/90 shadow-2xl overflow-hidden"
      >
        {/* ── Top Header: Order Number + Close Button ── */}
        <div className="flex items-center justify-between">
          <DialogHeader className="p-0">
            <DialogTitle className="text-base font-bold tracking-tight text-slate-900">
              {booking.orderNumber || 'ORD-1518'}
            </DialogTitle>
          </DialogHeader>

          <DialogClose className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer outline-none">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        {/* ── Live Operational Status Banner ── */}
        <div className="space-y-1.5">
          <div className="px-3 py-2 rounded-xl bg-brand-light border border-brand/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-brand">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span>{statusText}</span>
            </div>
            <span className="font-bold text-brand text-[11.5px]">
              {statusEta}
            </span>
          </div>

          <div className="text-[11px] px-1 flex items-center justify-between text-slate-400 font-medium">
            <span>Updated 1 min ago</span>
            <button
              type="button"
              onClick={() => toast.info('Opening live map route tracking')}
              className="inline-flex items-center gap-1 text-brand hover:underline font-semibold cursor-pointer"
            >
              <span>View map</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ── Customer & Pour Information ── */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[#0B1B3D] tracking-tight leading-snug">
            {booking.customerName || 'Turner Construction'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Foundation • Sat, Sep 12
          </p>
        </div>

        {/* ── Job Site Address with Directions ── */}
        <div className="flex items-start justify-between gap-2 pt-0.5">
          <div className="flex items-start gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-tight">
              <p className="font-semibold text-slate-900">
                {booking.jobSiteName || '24 Bay View Street'}
              </p>
              <p className="text-slate-500 mt-0.5">
                {booking.address || 'Camden, ME 04843'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              window.open(
                `https://maps.google.com/?q=${encodeURIComponent(
                  `${booking.jobSiteName || '24 Bay View Street'}, ${
                    booking.address || 'Camden, ME'
                  }`
                )}`,
                '_blank'
              )
            }
            className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline shrink-0 cursor-pointer pt-0.5"
          >
            <span>Directions</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {/* ── Arrival & Pour Timings Box ── */}
        <div className="grid grid-cols-2 gap-3 py-2 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">Arrive by</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">
              {arriveTimeStr}
            </span>
          </div>
          <div className="border-l border-slate-200/90 pl-3">
            <span className="text-[11px] text-slate-500 block">Pour</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">
              {pourTimeStr}
            </span>
          </div>
        </div>

        {/* ── Customer Contact ── */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-medium text-slate-500 block">
            Customer contact
          </label>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 truncate">
                Mike Vance • (207) 555-0142
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCall('Mike Vance', '(207) 555-0142')}
                className="h-7 px-2.5 rounded-lg border-slate-200 text-xs font-medium text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 transition-colors"
              >
                <Phone className="h-3 w-3 text-brand" />
                <span>Call</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleText('Mike Vance', '(207) 555-0142')}
                className="h-7 px-2.5 rounded-lg border-slate-200 text-xs font-medium text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 transition-colors"
              >
                <MessageSquare className="h-3 w-3 text-brand" />
                <span>Text</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Operator Details ── */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-medium text-slate-500 block">
            Operator • {pumpCode}
          </label>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate block">
                  {operatorName} • (207) 555-0168
                </span>
                <span
                  onClick={() => toast.info('Assign additional operator')}
                  className="text-[10px] text-brand font-medium hover:underline cursor-pointer inline-flex items-center gap-0.5 mt-0.5"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>1 operator</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCall(operatorName, '(207) 555-0168')}
                className="h-7 px-2.5 rounded-lg border-slate-200 text-xs font-medium text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 transition-colors"
              >
                <Phone className="h-3 w-3 text-brand" />
                <span>Call</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleText(operatorName, '(207) 555-0168')}
                className="h-7 px-2.5 rounded-lg border-slate-200 text-xs font-medium text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 transition-colors"
              >
                <MessageSquare className="h-3 w-3 text-brand" />
                <span>Text</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Special Washout & Gate Site Notes ── */}
        <div className="p-2.5 rounded-xl bg-brand-light border border-brand/20 flex items-start gap-2.5 text-xs text-brand-text font-medium">
          <FileText className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <p className="leading-snug">
            {booking.notes || 'Use north gate. Washout beside gravel pad.'}
          </p>
        </div>

        {/* ── Bottom Action Buttons: Quick edit + Open order ── */}
        <div className="pt-1 flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              if (onQuickEdit) {
                onQuickEdit(booking);
              }
            }}
            className="flex-1 h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Quick edit
          </Button>

          <Link
            href={`/orders/${booking.orderNumber || 'ORD-1518'}`}
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open order</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
