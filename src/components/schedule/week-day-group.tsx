"use client";

import { addDays, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { DayCounts } from "@/features/orders/types";
import { cn } from "@/lib/utils";

const TIMEZONE = "America/Chicago";
const ISO = "yyyy-MM-dd";

interface WeekDayGroupProps {
  /** The Monday of the week to show. */
  weekStart: Date;
  /** The open day (yyyy-MM-dd). */
  selectedIso: string;
  onDateChange: (date: Date) => void;
  /** Orders per day, keyed by yyyy-MM-dd. */
  counts: DayCounts;
  /** False while this week's counts are still loading: then a day with no count shows nothing. */
  countsKnown: boolean;
  className?: string;
}

/** Mon to Sun of one week. Each day shows its date and, under it, how many jobs it has (if any). */
export function WeekDayGroup({ weekStart, selectedIso, onDateChange, counts, countsKnown, className }: WeekDayGroupProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayIso = formatInTimeZone(new Date(), TIMEZONE, ISO);

  return (
    <div className={cn("grid grid-cols-7 gap-1", className)}>
      {days.map((day, index) => {
        const iso = format(day, ISO);
        const total = counts[iso]?.total ?? 0;
        const isSelected = iso === selectedIso;
        const isToday = iso === todayIso;
        const isWeekend = index >= 5;

        return (
          <button
            key={iso}
            type="button"
            onClick={() => onDateChange(day)}
            aria-label={`${format(day, "EEEE, MMMM d")}: ${total} ${total === 1 ? "job" : "jobs"}`}
            aria-pressed={isSelected}
            aria-current={isToday ? "date" : undefined}
            className={cn(
              "flex min-w-0 cursor-pointer flex-col items-center justify-center rounded-lg px-1 py-1 transition-colors sm:min-w-[3.25rem]",
              isSelected ? "bg-brand text-white shadow-sm" : "hover:bg-slate-100",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-medium leading-none",
                isSelected ? "text-white/75" : isToday ? "text-brand" : "text-slate-400",
              )}
            >
              {isToday && !isSelected ? "Today" : format(day, "EEE")}
            </span>
            <span
              className={cn(
                "mt-1.5 flex items-baseline gap-0.5 text-[15px] font-bold leading-none tabular-nums",
                isSelected ? "text-white" : isToday ? "text-brand" : isWeekend ? "text-slate-400" : "text-slate-900",
              )}
            >
              {format(day, "d")}
              {/* A new month is named on its 1st, since the row can roll into it. */}
              {format(day, "d") === "1" && (
                <span className={cn("text-[10px] font-semibold", isSelected ? "text-white/80" : "text-slate-400")}>
                  {format(day, "MMM")}
                </span>
              )}
            </span>
            {/* The number of jobs in a small circle; a faint dot on a free day */}
            <span className="mt-1 flex h-4 items-center">
              {total > 0 && (
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none tabular-nums",
                    isSelected ? "bg-white/25 text-white" : "bg-brand-light text-brand",
                  )}
                >
                  {total}
                </span>
              )}
              {total === 0 && countsKnown && (
                <span className={cn("h-1 w-1 rounded-full", isSelected ? "bg-white/50" : "bg-slate-300")} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
