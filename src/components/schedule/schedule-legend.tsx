"use client";

import { Info } from "lucide-react";

export function ScheduleLegend() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
      {/* ── Left: Dispatch Helper Note ── */}
      <div className="flex items-center gap-1.5">
        <Info className="h-4 w-4 text-slate-400 shrink-0" />
        <span>Click a time slot to book &bull; Drag bookings to reschedule</span>
      </div>

      {/* ── Right: Status Legend Chips ── */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Travel */}
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-5 rounded border border-slate-300 bg-slate-100 flex items-center justify-center opacity-85">
            <div className="w-full h-full bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_50%,#e2e8f0_50%,#e2e8f0_75%,transparent_75%,transparent)] bg-[length:6px_6px] rounded" />
          </div>
          <span className="text-slate-600 font-medium">Travel</span>
        </div>

        {/* On site */}
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-5 rounded border border-[#0D7A7F]/40 bg-[#E6F7F5]" />
          <span className="text-slate-600 font-medium">On site</span>
        </div>

        {/* Washout & return */}
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-5 rounded border border-slate-300 bg-slate-100 flex items-center justify-center opacity-85">
            <div className="w-full h-full bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_50%,#e2e8f0_50%,#e2e8f0_75%,transparent_75%,transparent)] bg-[length:6px_6px] rounded" />
          </div>
          <span className="text-slate-600 font-medium">Washout & return</span>
        </div>
      </div>
    </div>
  );
}
