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
  isToday,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  // View month tracks which month the user is currently viewing in the calendar
  const [viewDate, setViewDate] = useState<Date>(selected || new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

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
        </div>
      </div>

      {/* ── 2. Days of Week Header Row ── */}
      <div className="grid grid-cols-7 text-center pb-1.5 border-b border-slate-100">
        {weekDayLabels.map((day) => (
          <span
            key={day}
            className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
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
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                onSelect?.(day);
                // Also align viewDate if clicked outside month
                if (!isCurrentMonth) {
                  setViewDate(day);
                }
              }}
              className={cn(
                "h-8.5 w-8.5 mx-auto rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer select-none",
                // Current Month vs Outside Month
                isCurrentMonth
                  ? "text-slate-800 hover:bg-slate-100 font-medium"
                  : "text-slate-300 hover:bg-slate-50 opacity-40 hover:opacity-80 font-normal",
                // Today styling
                isCurrentDay &&
                  !isSelectedDay &&
                  "text-brand font-bold ring-1 ring-brand/30 bg-brand-light/40",
                // Selected Day styling (Solid Brand Color)
                isSelectedDay &&
                  "!bg-brand !text-white font-bold shadow-xs hover:!bg-brand-hover"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
