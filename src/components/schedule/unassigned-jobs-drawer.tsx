"use client";

import { useState } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduleBooking } from "./schedule-types";

interface UnassignedJobsDrawerProps {
  unassignedJobs?: ScheduleBooking[];
  onAssignJob?: (booking: ScheduleBooking) => void;
}

export function UnassignedJobsDrawer({
  unassignedJobs = [],
  onAssignJob,
}: UnassignedJobsDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const count = unassignedJobs.length;

  const dotColors = ["bg-brand", "bg-orange-500", "bg-slate-700", "bg-emerald-600"];

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all">
      {/* Header Bar */}
      <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 cursor-pointer text-left"
          aria-expanded={isOpen}
        >
          <span className="font-bold text-xs sm:text-sm text-slate-900">
            Unassigned jobs
          </span>
          <span className="text-slate-400 font-bold">&bull;</span>
          <span className="h-5 min-w-5 px-2 rounded-full bg-brand-light text-brand text-xs font-bold flex items-center justify-center">
            {count}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Right side: Sort label */}
        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800">
          <span>Sort by pour time</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/40">
          {count === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
              <AlertCircle className="h-4 w-4 shrink-0 text-slate-300" />
              <span>All booked pours are actively assigned to pump rigs.</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {unassignedJobs.map((job, idx) => {
                const hour = job.startHour;
                const timeLabel =
                  hour === 12
                    ? "12:00 PM"
                    : hour < 12
                    ? `${hour}:00 AM`
                    : `${hour - 12}:00 PM`;

                return (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand shadow-2xs transition-all flex flex-col justify-between min-w-[220px] max-w-[280px]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            dotColors[idx % dotColors.length]
                          )}
                        />
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {job.customerName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 pl-4.5 truncate">
                        {job.jobSiteName} &bull; {timeLabel}
                      </p>
                    </div>

                    <div className="mt-3 pl-4.5">
                      <button
                        type="button"
                        onClick={() => onAssignJob?.(job)}
                        className="h-7 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs hover:border-brand hover:text-brand transition-all cursor-pointer"
                      >
                        Assign pump
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
