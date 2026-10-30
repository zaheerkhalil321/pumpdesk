"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  getISODay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { WeekDayGroup } from "@/components/schedule/week-day-group";
import { countsRangeFor } from "@/features/orders/day-counts-range";
import { getDayCounts } from "@/features/orders/server/actions";
import type { DayCounts } from "@/features/orders/types";
import { cn } from "@/lib/utils";

const TIMEZONE = "America/Chicago";
const ISO = "yyyy-MM-dd";
/** Weeks on each side of the open week that the row can roll through. */
const WEEKS_EACH_SIDE = 26;

interface ScheduleDateHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  /** Orders per day around the open day, from the server. */
  dayCounts: DayCounts;
  className?: string;
}

/**
 * One line for choosing the day: Today on the left, then a row of days (each with its job count)
 * that rolls a week at a time with the arrows or a swipe, and on the right a calendar button that
 * opens the whole month, also with job counts. Rolling only browses; clicking a day opens it.
 */
export function ScheduleDateHeader({ currentDate, onDateChange, dayCounts, className }: ScheduleDateHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Counts for months browsed in the calendar, fetched on demand. The server's counts win.
  const [browsedCounts, setBrowsedCounts] = useState<DayCounts>({});
  const counts = { ...browsedCounts, ...dayCounts };
  // Which days' counts are here: the page brings countsRangeFor(currentDate), the rest are fetched.
  // A day outside these is unknown, not empty, so it shows nothing rather than "no jobs".
  const [loadedRanges, setLoadedRanges] = useState<{ from: string; to: string }[]>([]);
  const knownRanges = [countsRangeFor(currentDate), ...loadedRanges];
  const isWeekKnown = (monday: Date) => {
    const from = format(monday, ISO);
    const to = format(addDays(monday, 6), ISO);
    return knownRanges.some((r) => r.from <= from && to <= r.to);
  };
  const calendarCounts = Object.fromEntries(Object.entries(counts).map(([iso, c]) => [iso, c.total]));

  const todayIso = formatInTimeZone(new Date(), TIMEZONE, ISO);
  const isToday = format(currentDate, ISO) === todayIso;


  // The row holds many weeks side by side and rolls one week at a time, like RoxDay's strip.
  const selectedIso = format(currentDate, ISO);
  const selectedMonday = addDays(currentDate, 1 - getISODay(currentDate));
  const [anchor, setAnchor] = useState(selectedMonday);
  let weekOffset = Math.round(differenceInCalendarDays(selectedMonday, anchor) / 7);
  // A day picked far away (from the full calendar) rebuilds the row around it.
  if (Math.abs(weekOffset) > WEEKS_EACH_SIDE - 2) {
    setAnchor(selectedMonday);
    weekOffset = 0;
  }
  const weeks = Array.from({ length: WEEKS_EACH_SIDE * 2 + 1 }, (_, i) => addDays(anchor, (i - WEEKS_EACH_SIDE) * 7));
  const selectedIndex = WEEKS_EACH_SIDE + weekOffset;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const visibleIndex = useRef(selectedIndex);
  // The week in view while rolling, for the month label. Starts on the chosen week.
  const [viewIndex, setViewIndex] = useState(selectedIndex);

  const viewMonday = weeks[Math.min(Math.max(viewIndex, 0), weeks.length - 1)];
  const viewSunday = addDays(viewMonday, 6);
  const monthLabel =
    format(viewMonday, "yyyy") !== format(viewSunday, "yyyy")
      ? `${format(viewMonday, "MMM yyyy")} – ${format(viewSunday, "MMM yyyy")}`
      : format(viewMonday, "M") !== format(viewSunday, "M")
        ? `${format(viewMonday, "MMM")} – ${format(viewSunday, "MMM yyyy")}`
        : format(viewMonday, "MMM yyyy");
  const anchorKey = format(anchor, ISO);
  const shownAnchor = useRef<string | null>(null);

  // Roll to the open week: smoothly when it changes, straight there on first show or after a rebuild.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const jump = shownAnchor.current !== anchorKey;
    shownAnchor.current = anchorKey;
    visibleIndex.current = selectedIndex;
    el.scrollTo({ left: selectedIndex * el.clientWidth, behavior: jump ? "instant" : "smooth" });
  }, [selectedIndex, anchorKey]);

  // Keep the same week in view when the row changes size (or appears after being hidden).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      el.scrollTo({ left: visibleIndex.current * el.clientWidth, behavior: "instant" });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fetchedRanges = useRef(new Set<string>());
  const loadRange = async (from: string, to: string) => {
    const key = `${from}/${to}`;
    if (fetchedRanges.current.has(key)) return;
    fetchedRanges.current.add(key);
    const result = await getDayCounts({ from, to });
    if (!result.ok) {
      fetchedRanges.current.delete(key);
      return;
    }
    setBrowsedCounts((prev) => ({ ...prev, ...result.data }));
    setLoadedRanges((prev) => [...prev, { from, to }]);
  };

  const loadMonth = (month: Date) =>
    loadRange(format(startOfWeek(startOfMonth(month)), ISO), format(endOfWeek(endOfMonth(month)), ISO));

  // When the row settles on a week, note it and fetch its job counts if they are not here yet.
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (scroller && scroller.clientWidth > 0) setViewIndex(Math.round(scroller.scrollLeft / scroller.clientWidth));
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = scrollerRef.current;
      if (!el || el.clientWidth === 0) return;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      visibleIndex.current = index;
      const week = weeks[index];
      if (week && !isWeekKnown(week)) {
        void loadRange(format(week, ISO), format(addDays(week, 6), ISO));
      }
    }, 120);
  };

  // Round arrows that tint to the brand colour on hover and press in slightly when clicked.
  const arrowButton =
    "hidden sm:flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-2xs transition-all duration-150 hover:border-brand/40 hover:bg-brand-light hover:text-brand hover:shadow-sm active:scale-90";

  const roll = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  const iconButton =
    // Phones already have day arrows and a calendar in the row above, so these start at sm.
    "hidden sm:flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900";
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onDateChange(parseISO(todayIso))}
        className={cn(iconButton, "w-auto px-3 text-xs font-semibold", isToday && "text-brand")}
      >
        Today
      </button>

      <div className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />

      {/* The month (and year) of the week in view. Says "Oct – Nov 2026" when the week crosses a month. */}
      <span className="hidden w-28 shrink-0 text-center text-xs font-semibold text-slate-600 sm:block" aria-live="polite">
        {monthLabel}
      </span>

      <button
        type="button"
        onClick={() => roll(-1)}
        aria-label="Previous week"
        title="Previous week"
        className={cn(arrowButton, "mr-1")}
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        role="group"
        aria-label="Days of this week"
        className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain sm:w-[24rem] sm:flex-none"
      >
        {weeks.map((week) => (
          <WeekDayGroup
            key={format(week, ISO)}
            weekStart={week}
            selectedIso={selectedIso}
            onDateChange={onDateChange}
            counts={counts}
            countsKnown={isWeekKnown(week)}
            className="w-full shrink-0 snap-start"
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => roll(1)}
        aria-label="Next week"
        title="Next week"
        className={cn(arrowButton, "ml-1")}
      >
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>

      <div className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger aria-label="Open the calendar" title="Open the calendar" className={cn(iconButton, "outline-none")}>
          <CalendarIcon className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto rounded-2xl border-slate-200 bg-white p-2 shadow-2xl">
          <Calendar
            selected={currentDate}
            dayCounts={calendarCounts}
            onViewChange={loadMonth}
            onSelect={(newDate) => {
              onDateChange(newDate);
              setIsOpen(false);
            }}
          />
          <div className="flex items-center justify-between border-t border-slate-100 px-2 pt-2 text-xs">
            <span className="text-[11px] text-slate-400">Numbers show jobs per day</span>
            <button
              type="button"
              onClick={() => {
                onDateChange(parseISO(todayIso));
                setIsOpen(false);
              }}
              className="cursor-pointer font-semibold text-brand hover:underline"
            >
              Jump to Today
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
