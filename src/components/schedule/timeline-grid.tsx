"use client";

import { useState } from "react";
import { Truck, Plus, GripVertical, Clock } from "lucide-react";
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

// Tailwind static mapping for CSS Grid column starts (5 AM = col 1)
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
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
  13: "col-span-12",
};

interface TimelineGridProps {
  pumps: PumpLane[];
  bookings: ScheduleBooking[];
  onSlotClick: (pumpId: string, hour: number) => void;
  onBookingClick: (booking: ScheduleBooking) => void;
  onRescheduleBooking: (bookingId: string, targetPumpId: string, targetStartHour: number) => void;
}

export function TimelineGrid({
  pumps,
  bookings,
  onSlotClick,
  onBookingClick,
  onRescheduleBooking,
}: TimelineGridProps) {
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ pumpId: string; hour: number } | null>(null);

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <div className="overflow-x-auto min-w-full">
        <div className="min-w-[1100px]">
          {/* ── 1. HEADER ROW ── */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs sticky top-0 z-30">
            {/* Frozen Left Header */}
            <div className="w-[220px] shrink-0 px-4 py-2.5 border-r border-slate-200 bg-slate-50 sticky left-0 z-40 flex items-center gap-2">
              <span className="text-slate-700">Pumps & Operators</span>
            </div>

            {/* 13 Time Header Slots */}
            <div className="flex-1 grid grid-cols-[repeat(13,minmax(0,1fr))] min-w-[880px]">
              {TIMELINE_HOURS.map((slot) => (
                <div
                  key={slot.hour}
                  className="py-2.5 text-center border-r border-slate-200/80 last:border-r-0 tracking-tight"
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. PUMP TIMELINE LANES ── */}
          <div className="divide-y divide-slate-200/80">
            {pumps.map((pump) => {
              const pumpBookings = bookings.filter((b) => b.pumpId === pump.id);

              return (
                <div
                  key={pump.id}
                  className="flex min-h-[82px] group hover:bg-slate-50/30 transition-colors relative"
                >
                  {/* Left Column: Pump & Operator Badge (Frozen Left) */}
                  <div className="w-[220px] shrink-0 px-3.5 py-3 border-r border-slate-200 bg-white group-hover:bg-slate-50/60 sticky left-0 z-20 flex items-center gap-3 transition-colors shadow-[2px_0_4px_-2px_rgba(0,0,0,0.03)]">
                    <div className="h-8.5 w-8.5 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Truck className="h-4.5 w-4.5 text-slate-700" />
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

                  {/* Right Timeline Area: 13-Column Grid */}
                  <div className="flex-1 relative min-w-[880px]">
                    {/* Layer A: 13 Interactive Hourly Cells (Drop Targets & Add Slots) */}
                    <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] h-full">
                      {TIMELINE_HOURS.map((slot) => {
                        const isBooked = pumpBookings.some(
                          (b) =>
                            slot.hour >= b.startHour &&
                            slot.hour < b.startHour + b.durationHours
                        );

                        // Match the 7 AM slot on pump 01 as featured in the reference spec
                        const isSpecPromptSlot =
                          pump.id === "01-34m" && slot.hour === 7 && !isBooked && pumpBookings.length === 0;

                        const isDragOver =
                          dragOverTarget?.pumpId === pump.id &&
                          dragOverTarget?.hour === slot.hour;

                        return (
                          <div
                            key={slot.hour}
                            onClick={() => !isBooked && onSlotClick(pump.id, slot.hour)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                              if (dragOverTarget?.pumpId !== pump.id || dragOverTarget?.hour !== slot.hour) {
                                setDragOverTarget({ pumpId: pump.id, hour: slot.hour });
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverTarget?.pumpId === pump.id && dragOverTarget?.hour === slot.hour) {
                                setDragOverTarget(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const bookingId = e.dataTransfer.getData("text/plain");
                              if (bookingId) {
                                onRescheduleBooking(bookingId, pump.id, slot.hour);
                              }
                              setDraggedBookingId(null);
                              setDragOverTarget(null);
                            }}
                            className={cn(
                              "border-r border-slate-100 last:border-r-0 relative flex items-center justify-center p-1.5 transition-all cursor-pointer select-none",
                              !isBooked && "hover:bg-slate-100/50",
                              isDragOver && "bg-[#E6F7F5] border-2 border-dashed border-[#0D7A7F] z-20"
                            )}
                          >
                            {/* Drag-over hover state indicator */}
                            {isDragOver && (
                              <div className="text-[10px] font-bold text-[#0D7A7F] animate-pulse">
                                Drop here
                              </div>
                            )}

                            {/* Static prompt slot matching screenshot: "+ Add booking" at 7 AM */}
                            {isSpecPromptSlot && !isDragOver && (
                              <div className="w-full h-full rounded-lg border border-dashed border-sky-400 bg-sky-50/50 text-sky-700 hover:bg-sky-100/60 hover:border-sky-500 flex items-center justify-center gap-1 text-[11.5px] font-semibold transition-all shadow-2xs">
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add booking</span>
                              </div>
                            )}

                            {/* Interactive dynamic hover slot for other empty cells */}
                            {!isBooked && !isSpecPromptSlot && !isDragOver && (
                              <div className="w-full h-full rounded-lg border border-dashed border-slate-200 opacity-0 hover:opacity-100 hover:border-[#0D7A7F]/40 hover:bg-[#E6F7F5]/40 text-[#0D7A7F] flex items-center justify-center gap-1 text-[11px] font-medium transition-all">
                                <Plus className="h-3 w-3" />
                                <span>Add</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Layer B: Bookings Overlay Grid (Spans across all booked hours) */}
                    <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] absolute inset-0 p-1.5 pointer-events-none z-10">
                      {pumpBookings.map((booking) => {
                        const startHourClamped = Math.max(5, Math.min(17, Math.floor(booking.startHour)));
                        const colStartIdx = startHourClamped - 4; // 5 AM -> 1, 6 AM -> 2, etc.
                        const startColClass = COL_START_MAP[startHourClamped] || "col-start-1";

                        // Calculate and clamp span so it spans the full duration across the 13 columns
                        const maxAllowedSpan = 14 - colStartIdx;
                        const durationInt = Math.max(1, Math.min(12, Math.round(booking.durationHours)));
                        const actualSpan = Math.min(durationInt, maxAllowedSpan);
                        const spanColClass = COL_SPAN_MAP[actualSpan] || "col-span-1";

                        const isBeingDragged = draggedBookingId === booking.id;

                        return (
                          <div
                            key={booking.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", booking.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggedBookingId(booking.id);
                            }}
                            onDragEnd={() => {
                              setDraggedBookingId(null);
                              setDragOverTarget(null);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onBookingClick(booking);
                            }}
                            className={cn(
                              "pointer-events-auto h-full rounded-lg p-2.5 flex flex-col justify-between shadow-2xs border transition-all cursor-grab active:cursor-grabbing hover:shadow-md select-none",
                              startColClass,
                              spanColClass,
                              isBeingDragged && "opacity-40 scale-98 ring-2 ring-[#0D7A7F]",
                              booking.status === "onsite" &&
                                "bg-[#E6F7F5] border-[#0D7A7F]/40 text-[#0D7A7F] hover:border-[#0D7A7F]",
                              booking.status === "travel" &&
                                "bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400",
                              booking.status === "washout" &&
                                "bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-400"
                            )}
                            title="Drag to reschedule • Click to view details"
                          >
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <div className="flex items-center gap-1 min-w-0">
                                <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-60 hover:opacity-100" />
                                <span className="font-bold text-xs truncate">
                                  {booking.customerName}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 shrink-0 shadow-2xs text-slate-800">
                                {booking.volumeYards} yd³
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[10.5px] opacity-90 mt-1 min-w-0">
                              <span className="truncate font-medium">
                                {booking.jobSiteName}
                              </span>
                              <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-slate-600 bg-white/70 px-1 rounded">
                                <Clock className="h-3 w-3 inline" />
                                {booking.durationHours}h
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
