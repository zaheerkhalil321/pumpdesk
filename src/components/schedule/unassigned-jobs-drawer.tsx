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
  const [isOpen, setIsOpen] = useState(false);
  const count = unassignedJobs.length;

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer text-left"
        aria-expanded={isOpen}
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-bold text-xs sm:text-sm text-slate-900">
            Unassigned jobs
          </span>
          <span className="text-slate-400 font-bold">&bull;</span>
          <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-bold flex items-center justify-center">
            {count}
          </span>
          <span className="text-xs text-slate-500 font-normal ml-1">
            {count === 0
              ? "No jobs waiting for assignment."
              : `${count} ${count === 1 ? "job" : "jobs"} ready for dispatch.`}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/40">
          {count === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
              <AlertCircle className="h-4 w-4 shrink-0 text-slate-300" />
              <span>All booked pours are actively assigned to pump rigs.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {unassignedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => onAssignJob?.(job)}
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:border-[#0D7A7F] shadow-2xs cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">
                      {job.customerName}
                    </span>
                    <span className="text-[10.5px] font-bold text-[#0D7A7F] bg-[#E6F7F5] px-1.5 py-0.5 rounded">
                      {job.volumeYards} yd³
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {job.jobSiteName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
