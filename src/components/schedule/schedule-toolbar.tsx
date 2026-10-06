"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { addDays, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AppSelect } from "@/components/ui/app-select";
import { cn } from "@/lib/utils";
import { PumpLane, ScheduleViewMode } from "./schedule-types";
import { MobileFilterSheet } from "./mobile-filter-sheet";

const TIMEZONE = "America/Chicago";

interface ScheduleToolbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  bookingCount: number;
  dispatchedCount?: number;
  draftCount?: number;
  needsOperatorCount?: number;
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  pumps: PumpLane[];
  selectedPumpId: string;
  onSelectPump: (pumpId: string) => void;
  selectedOperator: string;
  onSelectOperator: (operator: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function ScheduleToolbar({
  currentDate,
  onDateChange,
  bookingCount,
  dispatchedCount = 0,
  draftCount = 0,
  needsOperatorCount = 0,
  viewMode,
  onViewModeChange,
  pumps,
  selectedPumpId,
  onSelectPump,
  selectedOperator,
  onSelectOperator,
  searchQuery = "",
  onSearchChange,
}: ScheduleToolbarProps) {
  const [isDesktopCalendarOpen, setIsDesktopCalendarOpen] = useState(false);
  const [isMobileCalendarOpen, setIsMobileCalendarOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const formattedDate = formatInTimeZone(
    currentDate,
    TIMEZONE,
    "EEEE, MMMM d, yyyy"
  );

  const compactMobileDate = formatInTimeZone(
    currentDate,
    TIMEZONE,
    "EEE, MMM d"
  );

  const handlePrevDay = () => onDateChange(subDays(currentDate, 1));
  const handleNextDay = () => onDateChange(addDays(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  // Distinct operators list from active company roster
  const operators = Array.from(
    new Set([
      "Rob Black",
      "Dave Smith",
      "Tony Perez",
      "Marcus Brody",
      "Sam Higgins",
      ...pumps.map((p) => p.operator).filter(Boolean),
    ])
  ) as string[];

  const activeFilterCount =
    (selectedPumpId !== "all" ? 1 : 0) +
    (selectedOperator !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const handleResetFilters = () => {
    onSelectPump("all");
    onSelectOperator("all");
    onSearchChange?.("");
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          A. MOBILE COMPACT TOOLBAR (Screens < md)
          Ultra-compact 2-row layout saving ~200px vertical height
         ══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col gap-2 pt-1 pb-1">
        {/* Row 1: Date Stepper (< Sat, Sep 12 >) + Toggle (Cards | Grid) + Filter Button */}
        {/* Row 1: Date Stepper (< Sat, Sep 12 >) + Toggle (Cards | Grid) + Filter Button */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          {/* Stepper with embedded Calendar Popover */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={handlePrevDay}
              className="h-8 w-6.5 sm:w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <Popover open={isMobileCalendarOpen} onOpenChange={setIsMobileCalendarOpen}>
              <PopoverTrigger className="px-1.5 sm:px-2 h-8 flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-900 hover:text-brand transition-colors cursor-pointer outline-none whitespace-nowrap shrink-0">
                <CalendarIcon className="h-3.5 w-3.5 text-brand shrink-0" />
                <span className="whitespace-nowrap">{compactMobileDate}</span>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="p-2 shadow-2xl rounded-2xl border-slate-200 bg-white w-auto"
              >
                <Calendar
                  selected={currentDate}
                  onSelect={(newDate) => {
                    onDateChange(newDate);
                    setIsMobileCalendarOpen(false);
                  }}
                />
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onDateChange(new Date());
                      setIsMobileCalendarOpen(false);
                    }}
                    className="font-semibold text-brand hover:underline cursor-pointer"
                  >
                    Jump to Today
                  </button>
                  <span className="text-slate-400 text-[10px] font-mono">
                    America/Chicago
                  </span>
                </div>
              </PopoverContent>
            </Popover>

            <button
              type="button"
              onClick={handleNextDay}
              className="h-8 w-6.5 sm:w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Next day"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* View Mode Toggle: Cards (list) vs Grid (day) */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={cn(
                  "px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  viewMode === "list"
                    ? "bg-brand text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("day")}
                className={cn(
                  "px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  viewMode !== "list"
                    ? "bg-brand text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Grid
              </button>
            </div>

            {/* Filter Button (Opens Bottom Sheet) */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className={cn(
                "h-8 px-2 sm:px-2.5 rounded-xl border flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap",
                activeFilterCount > 0
                  ? "bg-brand text-white border-brand shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-white text-brand text-[10px] font-bold flex items-center justify-center -mr-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Horizontal Scrolling Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-700 font-semibold text-[11px]">
            {bookingCount} {bookingCount === 1 ? "pour" : "pours"}
          </span>

          {dispatchedCount > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              {dispatchedCount} dispatched
            </span>
          )}

          {draftCount > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              {draftCount} draft
            </span>
          )}

          {needsOperatorCount > 0 && (
            <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-rose-800 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-lg text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              {needsOperatorCount} needs operator
            </span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          B. DESKTOP FULL TOOLBAR (Screens md and above)
         ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 pb-2">
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
          <Popover open={isDesktopCalendarOpen} onOpenChange={setIsDesktopCalendarOpen}>
            <PopoverTrigger className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group outline-none">
              <CalendarIcon className="h-4 w-4 text-slate-500 group-hover:text-brand transition-colors shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                {formattedDate}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200",
                  isDesktopCalendarOpen && "rotate-180"
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
                  setIsDesktopCalendarOpen(false);
                }}
              />

              {/* Quick Jump Shortcuts at Bottom */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onDateChange(new Date());
                    setIsDesktopCalendarOpen(false);
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

        {/* Dynamic Booking Count Subtitle + Live Dispatch Health Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-normal pl-0.5">
          <span>
            {bookingCount === 0
              ? "No bookings for this day"
              : `${bookingCount} ${bookingCount === 1 ? "booking" : "bookings"} scheduled`}
          </span>

          {bookingCount > 0 && (
            <>
              <span className="text-slate-300">•</span>
              {dispatchedCount > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {dispatchedCount} dispatched
                </span>
              )}
              {draftCount > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {draftCount} draft
                </span>
              )}
              {needsOperatorCount > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {needsOperatorCount} needs operator
                </span>
              )}
            </>
          )}
        </div>
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

    {/* Mobile Filter Sheet */}
    <MobileFilterSheet
      isOpen={isMobileFilterOpen}
      onOpenChange={setIsMobileFilterOpen}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange || (() => {})}
      pumps={pumps}
      selectedPumpId={selectedPumpId}
      onSelectPump={onSelectPump}
      operators={operators}
      selectedOperator={selectedOperator}
      onSelectOperator={onSelectOperator}
      onResetFilters={handleResetFilters}
      activeFilterCount={activeFilterCount}
    />
  </>
  );
}
