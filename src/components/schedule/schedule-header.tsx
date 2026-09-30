"use client";

import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewBookingClick: () => void;
}

export function ScheduleHeader({
  searchQuery,
  onSearchChange,
  onNewBookingClick,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      {/* 1. Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Schedule
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Plan crews, pumps, and jobs
        </p>
      </div>

      {/* 2. Global Search & CTA */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search orders, customers, job sites..."
            className="w-full h-9.5 pl-9 pr-3.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D7A7F]/20 focus:border-[#0D7A7F] transition-all shadow-2xs"
          />
        </div>

        {/* Primary New Booking Action */}
        <Button
          onClick={onNewBookingClick}
          className="h-9.5 px-4 rounded-lg bg-[#0D7A7F] hover:bg-[#0B6569] text-white text-xs sm:text-sm font-medium gap-1.5 shrink-0 shadow-2xs transition-all cursor-pointer hover:shadow-xs active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>New booking</span>
        </Button>
      </div>
    </div>
  );
}
