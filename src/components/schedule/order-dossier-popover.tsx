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
  UserCheck,
  Send,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { ScheduleBooking, PumpLane } from './schedule-types';
import { addOrUpdateBooking } from '@/lib/orders-store';
import { toast } from 'sonner';
import { AppSelect, SelectOption } from '@/components/ui/app-select';
import { cn } from '@/lib/utils';

const OPERATOR_ROSTER: { name: string; phone: string; cert: string }[] = [
  { name: 'Rob Black', phone: '(207) 555-0168', cert: 'ACPA Certified • 34M Lead' },
  { name: 'Dave Smith', phone: '(207) 555-0199', cert: '47M Heavy Boom Specialist' },
  { name: 'Tony Perez', phone: '(207) 555-0144', cert: 'Line Pump & Trailer Specialist' },
  { name: 'Marcus Brody', phone: '(207) 555-0112', cert: 'Commercial Pours • Relief Operator' },
  { name: 'Sam Higgins', phone: '(207) 555-0177', cert: 'Boom Apprentice • Yard Lead' },
];

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
  const [isChangingOperator, setIsChangingOperator] = React.useState(false);
  const [selectedOpToAssign, setSelectedOpToAssign] = React.useState<string>('');

  const [prevBookingId, setPrevBookingId] = React.useState(booking?.id);
  if (booking?.id !== prevBookingId) {
    setPrevBookingId(booking?.id);
    setSelectedOpToAssign('');
    setIsChangingOperator(false);
  }

  if (!booking) return null;

  const assignedPump = pumps.find((p) => p.id === booking.pumpId);
  const operatorDisplayName = booking.operator || '';
  const pumpCode = assignedPump?.code || 'Pump Rig';
  const isDispatched = booking.dispatchStatus === 'dispatched';

  const matchedOperator = OPERATOR_ROSTER.find((op) => op.name === operatorDisplayName);
  const operatorPhone = matchedOperator?.phone || '(207) 555-0168';
  const operatorCert = matchedOperator?.cert || 'Certified Operator';

  const operatorOptions: SelectOption[] = OPERATOR_ROSTER.map((op) => ({
    value: op.name,
    label: op.name,
    description: `${op.cert} • ${op.phone}`,
  }));

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

  const handleDispatch = () => {
    const updated: ScheduleBooking = {
      ...booking,
      operator: operatorDisplayName,
      dispatchStatus: 'dispatched',
      dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addOrUpdateBooking(updated);
    toast.success('Job Dispatched to Operator', {
      description: `${operatorDisplayName} will now see this job in their mobile schedule.`,
    });
  };

  const handleAssignOperator = (operatorToAssign?: string) => {
    const targetOperator = operatorToAssign || selectedOpToAssign;
    if (!targetOperator) return;

    const updated: ScheduleBooking = {
      ...booking,
      operator: targetOperator,
      dispatchStatus: 'draft',
    };
    addOrUpdateBooking(updated);
    setIsChangingOperator(false);
    setSelectedOpToAssign('');
    toast.success('Operator Assigned', {
      description: `${targetOperator} assigned as Draft. You can now dispatch.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[450px] p-6 rounded-2xl bg-white gap-4 border border-slate-200/90 shadow-2xl overflow-hidden"
      >
        {/* ── Top Header: Order Number + Close Button ── */}
        <div className="flex items-center justify-between">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
              {booking.orderNumber || 'ORD-1518'}
            </DialogTitle>
          </DialogHeader>

          <DialogClose className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer outline-none">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        {/* ── Live Operational Status Banner ── */}
        <div className="space-y-1.5">
          <div className="px-3.5 py-2.5 rounded-xl bg-brand-light border border-brand/20 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-semibold text-brand">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span>{statusText}</span>
            </div>
            <span className="font-bold text-brand text-xs sm:text-sm">
              {statusEta}
            </span>
          </div>

          <div className="text-xs px-1 flex items-center justify-between text-slate-400 font-medium">
            <span>Updated 1 min ago</span>
            <button
              type="button"
              onClick={() => toast.info('Opening live map route tracking')}
              className="inline-flex items-center gap-1 text-brand hover:underline font-semibold cursor-pointer"
            >
              <span>View map</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Customer & Pour Information ── */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#0B1B3D] tracking-tight leading-snug">
            {booking.customerName || 'Turner Construction'}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Foundation • Sat, Sep 12
          </p>
        </div>

        {/* ── Job Site Address with Directions ── */}
        <div className="flex items-start justify-between gap-2 pt-0.5">
          <div className="flex items-start gap-2 min-w-0">
            <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700 leading-snug">
              <p className="font-semibold text-slate-900">
                {booking.jobSiteName || '24 Bay View Street'}
              </p>
              <p className="text-slate-500 mt-0.5 text-xs">
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
            className="inline-flex items-center gap-1 text-xs sm:text-sm text-brand font-semibold hover:underline shrink-0 cursor-pointer pt-0.5"
          >
            <span>Directions</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Arrival & Pour Timings Box ── */}
        <div className="grid grid-cols-2 gap-3 py-2.5 px-4 rounded-xl border border-slate-200/90 bg-slate-50/60 text-xs">
          <div>
            <span className="text-xs text-slate-500 block font-medium">Arrive by</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">
              {arriveTimeStr}
            </span>
          </div>
          <div className="border-l border-slate-200/90 pl-4">
            <span className="text-xs text-slate-500 block font-medium">Pour</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">
              {pourTimeStr}
            </span>
          </div>
        </div>

        {/* ── Customer Contact ── */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-slate-500 block">
            Customer contact
          </label>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-slate-800 truncate">
                Mike Vance • (207) 555-0142
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCall('Mike Vance', '(207) 555-0142')}
                className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1.5 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-brand" />
                <span>Call</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleText('Mike Vance', '(207) 555-0142')}
                className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1.5 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5 text-brand" />
                <span>Text</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Operator Details & Dispatch Action ── */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500 block">
              Operator • {pumpCode}
            </label>
            {operatorDisplayName && !isChangingOperator && (
              <button
                type="button"
                onClick={() => setIsChangingOperator(true)}
                className="text-xs text-brand font-semibold hover:underline cursor-pointer"
              >
                Change operator
              </button>
            )}
          </div>

          {operatorDisplayName && !isChangingOperator ? (
            <>
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center shrink-0 text-brand font-bold text-xs">
                    {operatorDisplayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate block">
                      {operatorDisplayName}
                    </span>
                    <span className="text-xs text-slate-500 font-medium block truncate">
                      {operatorCert}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCall(operatorDisplayName, operatorPhone)}
                    className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1.5 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-brand" />
                    <span>Call</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleText(operatorDisplayName, operatorPhone)}
                    className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1.5 transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-brand" />
                    <span>Text</span>
                  </Button>
                </div>
              </div>

              {/* Dispatch to Operator Action Box */}
              {isDispatched ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900">
                      Dispatched to {operatorDisplayName} {booking.dispatchedAt ? `• ${booking.dispatchedAt}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDispatch}
                    className="text-[11.5px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    Re-dispatch
                  </button>
                </div>
              ) : (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="brand"
                    onClick={handleDispatch}
                    className="w-full h-10 rounded-xl font-semibold text-sm shadow-xs gap-2 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>Dispatch to {operatorDisplayName}</span>
                  </Button>
                  <p className="text-[11px] text-slate-400 text-center mt-1 font-medium">
                    Operator will not see this job until dispatched
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Unassigned or Changing Operator State */
            <div
              className={cn(
                'p-3 rounded-xl transition-all space-y-2',
                selectedOpToAssign
                  ? 'bg-slate-50/60 border border-slate-200'
                  : 'bg-rose-50/70 border border-rose-200'
              )}
            >
              {!selectedOpToAssign ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-800">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-semibold text-rose-700">
                      {operatorDisplayName ? 'Re-assign operator' : 'Needs operator'}
                    </span>
                  </div>
                  {operatorDisplayName && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingOperator(false);
                        setSelectedOpToAssign('');
                      }}
                      className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : operatorDisplayName ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingOperator(false);
                      setSelectedOpToAssign('');
                    }}
                    className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              <div className="space-y-2">
                <AppSelect
                  options={operatorOptions}
                  value={selectedOpToAssign || (isChangingOperator ? operatorDisplayName : undefined)}
                  placeholder="Select an operator"
                  onChange={(selectedName) => setSelectedOpToAssign(selectedName)}
                  icon={User}
                  size="sm"
                  className={cn(
                    'w-full bg-white shadow-2xs cursor-pointer transition-colors',
                    selectedOpToAssign
                      ? 'border-slate-200 hover:border-brand'
                      : 'border-rose-200 hover:border-brand'
                  )}
                />

                <Button
                  type="button"
                  variant="brand"
                  disabled={!selectedOpToAssign}
                  onClick={() => handleAssignOperator()}
                  className="w-full h-9 rounded-xl font-semibold text-xs shadow-xs gap-1.5 cursor-pointer bg-brand hover:bg-brand-hover text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>
                    {selectedOpToAssign
                      ? `Assign ${selectedOpToAssign}`
                      : 'Assign operator'}
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Special Washout & Gate Site Notes ── */}
        <div className="p-3 rounded-xl bg-brand-light border border-brand/20 flex items-start gap-2.5 text-sm text-brand-text font-medium">
          <FileText className="h-4.5 w-4.5 text-brand shrink-0 mt-0.5" />
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
            className="flex-1 h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Quick edit
          </Button>

          <Link
            href={`/orders/${booking.orderNumber || 'ORD-1518'}`}
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open order</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
