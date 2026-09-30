"use client";

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronDown,
  Maximize2,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PumpLane, ScheduleViewMode } from "./schedule-types";
import { toast } from "sonner";

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

  const currentPumpLabel =
    selectedPumpId === "all"
      ? "All pumps"
      : pumps.find((p) => p.id === selectedPumpId)?.code || "All pumps";

  const currentOperatorLabel =
    selectedOperator === "all" ? "All operators" : selectedOperator;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 pb-2">
      {/* ── Left Side: Date Controls & Subtext ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          {/* Prev / Today / Next Segmented Control */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="h-7 w-7 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="h-7 px-2.5 rounded-md text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="h-7 w-7 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next day"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Formatted Date Display */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              {formattedDate}
            </span>
          </div>
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
                    ? "bg-[#0F172A] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
                )}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* Filter: All pumps */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer outline-none">
            <span>{currentPumpLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-200">
            <DropdownMenuItem
              onClick={() => onSelectPump("all")}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-lg cursor-pointer",
                selectedPumpId === "all" ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700"
              )}
            >
              All pumps
            </DropdownMenuItem>
            {pumps.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => onSelectPump(p.id)}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-lg cursor-pointer",
                  selectedPumpId === p.id ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700"
                )}
              >
                {p.code} &bull; {p.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter: All operators */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer outline-none">
            <span>{currentOperatorLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 p-1 rounded-xl shadow-lg border-slate-200">
            <DropdownMenuItem
              onClick={() => onSelectOperator("all")}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-lg cursor-pointer",
                selectedOperator === "all" ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700"
              )}
            >
              All operators
            </DropdownMenuItem>
            {operators.map((op) => (
              <DropdownMenuItem
                key={op}
                onClick={() => onSelectOperator(op)}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-lg cursor-pointer",
                  selectedOperator === op ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700"
                )}
              >
                {op}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Expand schedule button (Annotated with V2 per user reference) */}
        <button
          type="button"
          onClick={() => {
            toast.info("Fullscreen Mode (Phase 2)", {
              description: "Expand schedule timeline is designated for Phase 2.",
            });
          }}
          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer group"
          title="Expand schedule (Phase 2)"
        >
          <Maximize2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
          <span>Expand schedule</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
            v2
          </span>
        </button>
      </div>
    </div>
  );
}
