"use client";

import { Truck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PumpLane, ScheduleBooking } from "./schedule-types";

const TIMELINE_HOURS = [
  { hour: 5, label: "5 AM" },
  { hour: 6, label: "6 AM" },
  { hour: 7, label: "7 AM" },
  { hour: 8, label: "8 AM" },
  { hour: 9, label: "9 AM" },
  { hour: 10, label: "10 AM" },
  { hour: 11, label: "11 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 13, label: "1 PM" },
  { hour: 14, label: "2 PM" },
  { hour: 15, label: "3 PM" },
  { hour: 16, label: "4 PM" },
  { hour: 17, label: "5 PM" },
];

// Tailwind static mapping for CSS Grid column starts (5 AM = index 1)
const COL_START_MAP: Record<number, string> = {
  5: "col-start-1",
  6: "col-start-2",
  7: "col-start-3",
  8: "col-start-4",
  9: "col-start-5",
  10: "col-start-6",
  11: "col-start-7",
  12: "col-start-8",
  13: "col-start-9",
  14: "col-start-10",
  15: "col-start-11",
  16: "col-start-12",
  17: "col-start-13",
};

// Tailwind static mapping for CSS Grid column spans (duration in hours)
const COL_SPAN_MAP: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
};

interface TimelineGridProps {
  pumps: PumpLane[];
  bookings: ScheduleBooking[];
  onSlotClick: (pumpId: string, hour: number) => void;
  onBookingClick: (booking: ScheduleBooking) => void;
}

export function TimelineGrid({
  pumps,
  bookings,
  onSlotClick,
  onBookingClick,
}: TimelineGridProps) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <div className="overflow-x-auto min-w-full">
        <div className="min-w-[1100px]">
          {/* ── 1. HEADER ROW ── */}
          <div className="grid grid-cols-[220px_repeat(13,1fr)] bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs sticky top-0 z-20">
            {/* Frozen Left Header */}
            <div className="px-4 py-2.5 border-r border-slate-200 bg-slate-50 sticky left-0 z-30 flex items-center gap-2">
              <span className="text-slate-700">Pumps & Operators</span>
            </div>

            {/* 13 Time Header Slots */}
            {TIMELINE_HOURS.map((slot) => (
              <div
                key={slot.hour}
                className="py-2.5 text-center border-r border-slate-200/80 last:border-r-0 tracking-tight"
              >
                {slot.label}
              </div>
            ))}
          </div>

          {/* ── 2. PUMP TIMELINE LANES ── */}
          <div className="divide-y divide-slate-200/80">
            {pumps.map((pump) => {
              const pumpBookings = bookings.filter((b) => b.pumpId === pump.id);

              return (
                <div
                  key={pump.id}
                  className="grid grid-cols-[220px_repeat(13,1fr)] min-h-[78px] group hover:bg-slate-50/30 transition-colors relative"
                >
                  {/* Left Column: Pump & Operator Badge */}
                  <div className="px-3.5 py-3 border-r border-slate-200 bg-white group-hover:bg-slate-50/60 sticky left-0 z-10 flex items-center gap-3 transition-colors shadow-[2px_0_4px_-2px_rgba(0,0,0,0.03)]">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Truck className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate tracking-tight">
                        {pump.code}
                      </p>
                      <p
                        className={cn(
                          "text-[11px] truncate mt-0.5",
                          pump.operator
                            ? "text-slate-500 font-medium"
                            : "text-slate-400 italic"
                        )}
                      >
                        {pump.operator || "No default operator"}
                      </p>
                    </div>
                  </div>

                  {/* 13 Timeline Hour Cells with Interactive Add Booking Slot */}
                  {TIMELINE_HOURS.map((slot) => {
                    const isBooked = pumpBookings.some(
                      (b) =>
                        slot.hour >= b.startHour &&
                        slot.hour < b.startHour + b.durationHours
                    );

                    // Specifically match the 7 AM slot on pump 01 as featured in the reference spec
                    const isSpecPromptSlot =
                      pump.id === "01-34m" && slot.hour === 7 && !isBooked;

                    return (
                      <div
                        key={slot.hour}
                        onClick={() => !isBooked && onSlotClick(pump.id, slot.hour)}
                        className={cn(
                          "border-r border-slate-100 last:border-r-0 relative flex items-center justify-center p-1.5 transition-colors cursor-pointer",
                          !isBooked && "hover:bg-slate-100/50"
                        )}
                      >
                        {/* Static prompt slot matching screenshot: "+ Add booking" at 7 AM */}
                        {isSpecPromptSlot && (
                          <div className="w-full h-full rounded-lg border border-dashed border-sky-400 bg-sky-50/50 text-sky-700 hover:bg-sky-100/60 hover:border-sky-500 flex items-center justify-center gap-1 text-[11.5px] font-semibold transition-all shadow-2xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add booking</span>
                          </div>
                        )}

                        {/* Interactive dynamic hover slot for other empty cells */}
                        {!isBooked && !isSpecPromptSlot && (
                          <div className="w-full h-full rounded-lg border border-dashed border-slate-200 opacity-0 hover:opacity-100 hover:border-[#0D7A7F]/40 hover:bg-[#E6F7F5]/40 text-[#0D7A7F] flex items-center justify-center gap-1 text-[11px] font-medium transition-all">
                            <Plus className="h-3 w-3" />
                            <span>Add</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Render Booked Orders spanning grid columns */}
                  {pumpBookings.map((booking) => {
                    const startColClass =
                      COL_START_MAP[Math.floor(booking.startHour)] || "col-start-1";
                    const spanColClass =
                      COL_SPAN_MAP[Math.round(booking.durationHours)] || "col-span-3";

                    return (
                      <div
                        key={booking.id}
                        onClick={() => onBookingClick(booking)}
                        className={cn(
                          "absolute top-2 bottom-2 z-10 rounded-lg p-2.5 flex flex-col justify-between shadow-2xs border transition-all cursor-pointer hover:shadow-xs",
                          startColClass,
                          spanColClass,
                          booking.status === "onsite" &&
                            "bg-[#E6F7F5] border-[#0D7A7F]/30 text-[#0D7A7F] hover:border-[#0D7A7F]",
                          booking.status === "travel" &&
                            "bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400",
                          booking.status === "washout" &&
                            "bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-400"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate">
                            {booking.customerName}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/70">
                            {booking.volumeYards} yd³
                          </span>
                        </div>
                        <p className="text-[10.5px] truncate opacity-85">
                          {booking.jobSiteName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
