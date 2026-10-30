"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addYears,
  subYears,
  format,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  /** A number to show under each day (keyed by yyyy-MM-dd), such as how many jobs it has. */
  dayCounts?: Record<string, number>;
  /** Called with the first day of the month whenever another month is shown. */
  onViewChange?: (month: Date) => void;
}

export function Calendar({ selected, onSelect, className, dayCounts, onViewChange }: CalendarProps) {
  // View month tracks which month the user is currently viewing in the calendar
  const [viewDate, setViewDate] = useState<Date>(selected || new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Today in the company's timezone, so the highlight matches the rest of the app.
  const todayKey = formatInTimeZone(new Date(), "America/Chicago", "yyyy-MM-dd");

  const showMonth = (date: Date) => {
    setViewDate(date);
    onViewChange?.(startOfMonth(date));
  };
  const handlePrevMonth = () => showMonth(subMonths(viewDate, 1));
  const handleNextMonth = () => showMonth(addMonths(viewDate, 1));
  const handlePrevYear = () => showMonth(subYears(viewDate, 1));
  const handleNextYear = () => showMonth(addYears(viewDate, 1));

  return (
    <div className={cn("p-3 bg-white select-none w-[280px]", className)}>
      {/* ── 1. Month & Year Header with Top-Right Navigation Controls ── */}
      <div className="flex items-center justify-between pb-3 px-1">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
          {format(viewDate, "MMMM yyyy")}
        </h4>

        {/* Stepper Controls (< >) Grouped Cleanly in Header */}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevYear}
            className="h-6.5 w-6.5 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Previous year"
            aria-label="Previous year"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="h-6.5 w-6.5 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="h-6.5 w-6.5 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            className="h-6.5 w-6.5 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Next year"
            aria-label="Next year"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. Days of Week Header Row ── */}
      <div className="grid grid-cols-7 text-center pb-1.5 border-b border-slate-100">
        {weekDayLabels.map((day) => (
          <span
            key={day}
            className="text-[11px] font-semibold text-slate-400"
          >
            {day}
          </span>
        ))}
      </div>

      {/* ── 3. Days Grid ── */}
      <div className="grid grid-cols-7 gap-1 pt-2">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isSelectedDay = selected ? isSameDay(day, selected) : false;
          const isCurrentDay = format(day, "yyyy-MM-dd") === todayKey;
          const count = dayCounts?.[format(day, "yyyy-MM-dd")] ?? 0;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                onSelect?.(day);
                // Also align viewDate if clicked outside month
                if (!isCurrentMonth) {
                  showMonth(day);
                }
              }}
              className={cn(
                "relative h-8.5 w-8.5 mx-auto rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer select-none",
                // Current Month vs Outside Month
                isCurrentMonth
                  ? "text-slate-800 hover:bg-slate-100 font-medium"
                  : "text-slate-300 hover:bg-slate-50 opacity-40 hover:opacity-80 font-normal",
                // Today styling
                isCurrentDay &&
                  !isSelectedDay &&
                  "text-brand font-bold border border-brand/50 bg-brand-light/40",
                // Selected Day styling (Solid Brand Color)
                isSelectedDay &&
                  "!bg-brand !text-white font-bold shadow-xs hover:!bg-brand-hover"
              )}
            >
              {/* A day with jobs lifts its number a little to fit the count under it, in the same size cell. */}
              <span className={cn("leading-none", count > 0 && "-translate-y-1")}>{format(day, "d")}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "absolute bottom-1 text-[9px] font-bold leading-none",
                    isSelectedDay ? "text-white/90" : isCurrentMonth ? "text-brand" : "text-slate-300"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
