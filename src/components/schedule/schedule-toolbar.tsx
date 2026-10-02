"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { addDays, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";
import { PumpLane, ScheduleViewMode } from "./schedule-types";

const TIMEZONE = "America/Chicago";

interface ScheduleToolbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  bookingCount: number;
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  pumps: PumpLane[];
  selectedPumpId: string;
  onSelectPump: (pumpId: string) => void;
  selectedOperator: string;
  onSelectOperator: (operator: string) => void;
}

export function ScheduleToolbar({
  currentDate,
  onDateChange,
  bookingCount,
  viewMode,
  onViewModeChange,
  pumps,
  selectedPumpId,
  onSelectPump,
  selectedOperator,
  onSelectOperator,
}: ScheduleToolbarProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const formattedDate = formatInTimeZone(
    currentDate,
    TIMEZONE,
    "EEEE, MMMM d, yyyy"
  );

  const handlePrevDay = () => onDateChange(subDays(currentDate, 1));
  const handleNextDay = () => onDateChange(addDays(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  // Distinct operators list
  const operators = Array.from(
    new Set(pumps.map((p) => p.operator).filter(Boolean))
  ) as string[];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 pb-2">
      {/* ── Left Side: Date Controls & Subtext ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          {/* 1. Original Segmented Stepper Control (< Today >) */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="h-8 w-8 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="h-8 px-2.5 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="h-8 w-8 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next day"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 2. Interactive Date Popover Trigger with Bespoke Calendar */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group outline-none">
              <CalendarIcon className="h-4 w-4 text-slate-500 group-hover:text-brand transition-colors shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                {formattedDate}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200",
                  isCalendarOpen && "rotate-180"
                )}
              />
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="p-2 shadow-2xl rounded-2xl border-slate-200 bg-white w-auto"
            >
              {/* Bespoke Crisp Calendar */}
              <Calendar
                selected={currentDate}
                onSelect={(newDate) => {
                  onDateChange(newDate);
                  setIsCalendarOpen(false);
                }}
              />

              {/* Quick Jump Shortcuts at Bottom */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onDateChange(new Date());
                    setIsCalendarOpen(false);
                  }}
                  className="font-semibold text-brand hover:underline cursor-pointer"
                >
                  Jump to Today
                </button>
                <span className="text-slate-400 text-[11px] font-mono">
                  America/Chicago
                </span>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Dynamic Booking Count Subtitle */}
        <p className="text-xs text-slate-500 font-normal pl-0.5">
          {bookingCount === 0
            ? "No bookings for this day"
            : `${bookingCount} ${bookingCount === 1 ? "booking" : "bookings"} scheduled`}
        </p>
      </div>

      {/* ── Right Side: View Mode, Filters & V2 Expand ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* View Mode Toggle: Day / Week / List */}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/70 p-0.5 shadow-2xs">
          {(["day", "week", "list"] as ScheduleViewMode[]).map((mode) => {
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all cursor-pointer",
                  isActive
                    ? "bg-brand text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
                )}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* Filter: All pumps */}
        <div className="w-36 sm:w-44">
          <AppSelect
            size="sm"
            align="end"
            value={selectedPumpId}
            onChange={onSelectPump}
            options={[
              { value: "all", label: "All pumps" },
              ...pumps.map((p) => ({
                value: p.id,
                label: `${p.code} • ${p.name}`,
              })),
            ]}
            className="h-8 text-xs font-medium"
            contentClassName="w-56"
          />
        </div>

        {/* Filter: All operators */}
        <div className="w-36 sm:w-40">
          <AppSelect
            size="sm"
            align="end"
            value={selectedOperator}
            onChange={onSelectOperator}
            options={[
              { value: "all", label: "All operators" },
              ...operators.map((op) => ({
                value: op,
                label: op,
              })),
            ]}
            className="h-8 text-xs font-medium"
            contentClassName="w-48"
          />
        </div>
      </div>
    </div>
  );
}
