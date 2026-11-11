'use client';

import React from 'react';
import { useReachOut } from '@/components/orders/use-reach-out';
import { useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  ModalCloseButton,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  ArrowUpRight,
  User,
  UserCheck,
  Send,
  Check,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { ScheduleBooking, PumpLane } from './schedule-types';
import { updateOrder } from '@/features/orders/server/actions';
import { QUARTER_HOUR_CLOCKS, clockFromHour } from '@/features/orders/mappers';
import { reportAction } from '@/lib/action-feedback';
import type { OrderFormOperator } from '@/features/orders/types';
import { toast } from 'sonner';
import { AppSelect, SelectOption } from '@/components/ui/app-select';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface OrderDossierModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: ScheduleBooking | null;
  pumps: PumpLane[];
  /** Real operators the order can be assigned to. */
  operators: OrderFormOperator[];
  onQuickEdit?: (booking: ScheduleBooking) => void;
  /** Another pour on the same pump at the same time, if there is one. */
  overlapWith?: ScheduleBooking | null;
  /** Opens that other order's popup. */
  onOpenOrder?: (booking: ScheduleBooking) => void;
}

export function OrderDossierModal({
  isOpen,
  onOpenChange,
  booking,
  pumps,
  operators,
  onQuickEdit,
  overlapWith,
  onOpenOrder,
}: OrderDossierModalProps) {
  const router = useRouter();
  const [isSaving, startSaving] = React.useTransition();
  const [isChangingOperator, setIsChangingOperator] = React.useState(false);
  const [selectedOpToAssign, setSelectedOpToAssign] = React.useState<string>('');

  const [prevBookingId, setPrevBookingId] = React.useState(booking?.id);
  if (booking?.id !== prevBookingId) {
    setPrevBookingId(booking?.id);
    setSelectedOpToAssign('');
    setIsChangingOperator(false);
  }

  const { openText, openCall, reachDialogs } = useReachOut(booking?.jobId);

  if (!booking) return null;

  const assignedPump = pumps.find((p) => p.id === booking.pumpId);
  const operatorDisplayName = booking.operator || '';
  const pumpCode = assignedPump?.code || 'Pump Rig';
  const isDispatched = booking.dispatchStatus === 'dispatched';

  const matchedOperator = operators.find((op) => op.name === operatorDisplayName);
  const operatorPhone = matchedOperator?.phone ?? '';

  const operatorOptions: SelectOption[] = operators.map((op) => ({
    value: op.name,
    label: op.name,
    description: op.phone || undefined,
  }));

  // Contact details saved with the order.
  const contactName = booking.contactName ?? '';
  const contactPhone = booking.contactPhone ?? '';
  const serviceDateLabel = booking.serviceDate
    ? format(parse(booking.serviceDate, 'yyyy-MM-dd', new Date()), 'EEE, MMM d, yyyy')
    : '';

  // Times saved with the order, shown in the order's own timezone.
  const pourTimeStr = booking.pourTimeLabel ?? '';
  const arriveTimeStr = booking.arriveByLabel ?? pourTimeStr;

  // Every 15 minutes; an order saved at an odd time keeps showing it.
  const pourTimeOptions: SelectOption[] = (
    QUARTER_HOUR_CLOCKS.includes(pourTimeStr) || !pourTimeStr
      ? QUARTER_HOUR_CLOCKS
      : [pourTimeStr, ...QUARTER_HOUR_CLOCKS]
  ).map((clock) => ({ value: clock, label: clock }));

  // Status shown in the banner, from the real dispatch state.
  const statusText = isDispatched
    ? 'Dispatched to operator'
    : operatorDisplayName
    ? 'Operator assigned • Not dispatched yet'
    : 'Needs operator';

  // Texts and calls go through Twilio, from small dialogs.
  const personFor = (recipient: 'contact' | 'operator') =>
    recipient === 'contact'
      ? { recipient, recipientId: booking.contactId ?? '', name: contactName, phone: contactPhone }
      : { recipient, recipientId: matchedOperator?.id ?? '', name: operatorDisplayName, phone: operatorPhone };
  const handleText = (recipient: 'contact' | 'operator') => openText(personFor(recipient));
  const handleCall = (recipient: 'contact' | 'operator') => openCall(personFor(recipient));

  /** Saves an operator or dispatch change, then refreshes the schedule. */
  const saveChange = (
    change: { employeeId?: string | null; dispatch?: boolean },
    success: { title: string; description: string },
  ) => {
    if (!booking.jobId || booking.version === undefined) return;
    const { jobId, version } = booking;
    startSaving(async () => {
      const result = await updateOrder({ id: jobId, version, ...change });
      if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
      setIsChangingOperator(false);
      setSelectedOpToAssign('');
      toast.success(success.title, { description: success.description });
    });
  };

  /** Moves the pour to a new time on the same day. Length and arrival lead time stay the same. */
  const handlePourTimeChange = (clock: string) => {
    if (!booking.jobId || booking.version === undefined || clock === pourTimeStr) return;
    const { jobId, version } = booking;
    startSaving(async () => {
      const result = await updateOrder({ id: jobId, version, pourTime: clock });
      if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
      toast.success('Pour time changed', {
        description: `${booking.customerName} now pours at ${clock}.`,
      });
    });
  };

  const handleDispatch = () => {
    saveChange(
      { dispatch: true },
      {
        title: 'Job dispatched to operator',
        description: `${operatorDisplayName} is told about this job.`,
      },
    );
  };

  const handleUnassignOperator = () => {
    saveChange(
      { employeeId: null },
      {
        title: 'Operator unassigned',
        description: `${operatorDisplayName || 'Operator'} unassigned from this order.`,
      },
    );
  };

  const handleAssignOperator = (operatorToAssign?: string) => {
    const targetOperator = operatorToAssign || selectedOpToAssign;
    const operator = operators.find((o) => o.name === targetOperator);
    if (!operator) return;
    saveChange(
      { employeeId: operator.id },
      {
        title: 'Operator assigned',
        description: `${operator.name} assigned. You can now dispatch.`,
      },
    );
  };

  // ── Address: first line as entered, second line only when there is one ──
  const rawJobSite = booking.jobSiteName || '';
  const rawAddress = booking.address || '';
  const displayStreet = rawJobSite;
  const displayCityStateZip = rawAddress && rawAddress !== rawJobSite ? rawAddress : '';
  const directionsQuery = [displayStreet, displayCityStateZip].filter(Boolean).join(', ');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100%-1.5rem)] sm:max-w-[450px] p-4 sm:p-6 rounded-2xl bg-white gap-3.5 sm:gap-4 border border-slate-200/90 shadow-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden"
        >
          {/* ── Top Header: Order Number + Close Button ── */}
          <div className="flex items-center justify-between">
            <DialogHeader className="p-0">
              <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                {booking.orderNumber}
              </DialogTitle>
            </DialogHeader>

            <DialogClose render={<ModalCloseButton size="sm" />} />
          </div>

          {/* ── Live Operational Status Banner ── */}
          <div className="space-y-1.5">
            <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-brand-light border border-brand/20 flex items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-brand truncate min-w-0">
                <span className="h-2 w-2 rounded-full bg-brand animate-pulse shrink-0" />
                <span className="truncate">{statusText}</span>
              </div>
            </div>
          </div>

          {/* ── Overlap warning: allowed, but worth a second look ── */}
          {overlapWith && (
            <div className="flex items-start justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <div className="flex min-w-0 items-start gap-2">
                <TriangleAlert className="mt-px h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <span className="font-semibold">Overlaps another pour on this pump.</span>{' '}
                  {overlapWith.customerName} ({overlapWith.orderNumber}) is on it from{' '}
                  {clockFromHour(overlapWith.startHour)} to {clockFromHour(overlapWith.startHour + overlapWith.durationHours)}.
                </span>
              </div>
              {onOpenOrder && (
                <button
                  type="button"
                  onClick={() => onOpenOrder(overlapWith)}
                  className="shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 font-semibold text-amber-800 underline-offset-2 hover:underline"
                >
                  View {overlapWith.orderNumber}
                </button>
              )}
            </div>
          )}

          {/* ── Customer & Pour Information ── */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#0B1B3D] tracking-tight leading-snug">
              {booking.customerName || 'Turner Construction'}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {[booking.pourType, booking.volumeYards ? `${booking.volumeYards} yd³` : '', serviceDateLabel].filter(Boolean).join(' • ')}
            </p>
          </div>

          {/* ── Job Site Address with Directions ── */}
          <div className="flex items-start justify-between gap-2 pt-0.5">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700 leading-snug">
                <p className="font-semibold text-slate-900">
                  {displayStreet}
                </p>
                {displayCityStateZip && (
                  <p className="text-slate-500 mt-0.5 text-xs">
                    {displayCityStateZip}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                window.open(
                  `https://maps.google.com/?q=${encodeURIComponent(directionsQuery)}`,
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
              <AppSelect
                size="sm"
                value={pourTimeStr}
                onChange={handlePourTimeChange}
                options={pourTimeOptions}
                disabled={isSaving}
                className="mt-0.5 h-9 text-sm font-bold"
                contentClassName="max-h-64"
              />
            </div>
          </div>

          {/* ── Customer Contact (only when the order has one) ── */}
          {contactName && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-500 block">
                Customer contact
              </label>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate block">
                      {contactName}
                    </span>
                  </div>
                </div>
                {contactPhone && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCall('contact')}
                      className="h-8 px-2.5 sm:px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 sm:gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5 text-brand" />
                      <span>Call</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleText('contact')}
                      className="h-8 px-2.5 sm:px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 sm:gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-brand" />
                      <span>Text</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    <Avatar className="h-9 w-9 rounded-full border border-slate-200/80 shrink-0">
                      <AvatarFallback className="bg-brand-light text-brand font-bold text-xs">
                        {operatorDisplayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                        {operatorDisplayName}
                      </span>
                    </div>
                  </div>
                  {operatorPhone && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCall('operator')}
                      className="h-8 px-2.5 sm:px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 sm:gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5 text-brand" />
                      <span>Call</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleText('operator')}
                      className="h-8 px-2.5 sm:px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 sm:gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-brand" />
                      <span>Text</span>
                    </Button>
                  </div>
                  )}
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
                      onClick={handleUnassignOperator}
                      className="text-[11.5px] font-semibold text-emerald-800 hover:text-rose-600 hover:underline cursor-pointer transition-colors"
                    >
                      Unassign
                    </button>
                  </div>
                ) : (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="brand"
                      onClick={handleDispatch}
                      disabled={isSaving}
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
                    disabled={!selectedOpToAssign || isSaving}
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

          {/* ── Site notes (only when the order has some) ── */}
          {booking.notes && (
            <div className="p-3 rounded-xl bg-brand-light border border-brand/20 flex items-start gap-2.5 text-sm text-brand-text font-medium">
              <FileText className="h-4.5 w-4.5 text-brand shrink-0 mt-0.5" />
              <p className="leading-snug">{booking.notes}</p>
            </div>
          )}

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
      {reachDialogs}
    </>
  );
}
