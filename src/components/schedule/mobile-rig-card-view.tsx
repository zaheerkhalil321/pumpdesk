'use client';

import {
  Truck,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  HardHat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PumpLane, ScheduleBooking } from './schedule-types';

interface MobileRigCardViewProps {
  pumps: PumpLane[];
  bookings: ScheduleBooking[];
  onBookingClick: (booking: ScheduleBooking) => void;
  onSlotClick: (pumpId: string, hour: number) => void;
}

export function MobileRigCardView({
  pumps,
  bookings,
  onBookingClick,
  onSlotClick,
}: MobileRigCardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
      {pumps.map((pump) => {
        const pumpBookings = bookings.filter((b) => b.pumpId === pump.id);
        const hasBookings = pumpBookings.length > 0;

        return (
          <div
            key={pump.id}
            className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all"
          >
            {/* ── RIG HEADER CARD ── */}
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Truck className="h-5 w-5 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight truncate">
                      {pump.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                      {pump.boomLength}
                    </span>
                    {pumpBookings.length > 1 && (
                      <span className="text-[10px] font-semibold text-brand bg-brand-light border border-brand/20 px-1.5 py-0.5 rounded-full">
                        {pumpBookings.length} jobs
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                    {pump.name}
                  </p>
                </div>
              </div>

              {/* Quick Add Button for this Rig */}
              <button
                type="button"
                onClick={() => onSlotClick(pump.id, 7)}
                className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand hover:border-brand/40 shadow-2xs transition-colors cursor-pointer active:scale-95 shrink-0"
                title={`Book pour on ${pump.code}`}
                aria-label={`Book pour on ${pump.code}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* ── RIG BOOKINGS / POUR ORDERS ── */}
            <div
              className={cn(
                'p-3.5',
                hasBookings
                  ? 'flex items-stretch gap-3 overflow-x-auto scrollbar-thin snap-x snap-mandatory'
                  : 'space-y-2.5',
              )}
            >
              {hasBookings ? (
                pumpBookings.map((booking) => {
                  const isDispatched = booking.dispatchStatus === 'dispatched';
                  const isDraft = booking.dispatchStatus === 'draft' || (!booking.dispatchStatus && booking.operator);

                  const startFormatted =
                    booking.startHour <= 12
                      ? `${booking.startHour}:00 AM`
                      : `${booking.startHour - 12}:00 PM`;

                  const endHour = booking.startHour + booking.durationHours;
                  const endFormatted =
                    endHour <= 12
                      ? `${endHour}:00 AM`
                      : `${endHour - 12}:00 PM`;

                  return (
                    <div
                      key={booking.id}
                      onClick={() => onBookingClick(booking)}
                      className={cn(
                        'p-3.5 rounded-xl border transition-all cursor-pointer group hover:shadow-xs active:scale-99',
                        'w-[84%] sm:w-[320px] shrink-0 snap-start',
                        isDispatched
                          ? 'border-emerald-200/80 bg-emerald-50/20 hover:border-emerald-300'
                          : isDraft
                            ? 'border-amber-200/80 bg-amber-50/20 hover:border-amber-300'
                            : 'border-rose-200/80 bg-rose-50/20 hover:border-rose-300',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Customer Name & Order # */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-brand transition-colors">
                              {booking.customerName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {booking.orderNumber}
                            </span>
                          </div>

                          {/* Time & Duration */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1 flex-wrap">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 whitespace-nowrap">
                              {startFormatted} – {endFormatted}
                            </span>
                            <span className="text-slate-400 whitespace-nowrap">
                              ({booking.durationHours} hrs)
                            </span>
                          </div>

                          {/* Location & Job Site */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {booking.address || booking.jobSiteName}
                            </span>
                          </div>

                          {/* Assigned Operator for this Pour (matches desktop) */}
                          {booking.operator && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium mt-1">
                              <HardHat className="h-3 w-3 text-brand shrink-0" />
                              <span>{booking.operator}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Pill: Volume & Status */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                            {booking.volumeYards} yd³
                          </span>

                          {isDispatched ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>Dispatched</span>
                            </span>
                          ) : isDraft ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>Draft</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-full">
                              <AlertCircle className="h-2.5 w-2.5" />
                              <span>Operator Needed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Empty state for this Rig */
                <div className="p-3.5 rounded-xl border border-dashed border-slate-200 text-center flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    No pours scheduled today
                  </span>
                  <button
                    type="button"
                    onClick={() => onSlotClick(pump.id, 7)}
                    className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Book pour</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
