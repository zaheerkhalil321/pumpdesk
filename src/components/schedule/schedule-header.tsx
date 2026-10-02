"use client";

import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

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
    <PageHeader
      title="Schedule"
      description="Plan crews, pumps, and jobs"
      borderBottom
      actions={
        <>
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search orders, customers, job sites..."
              className="h-9 pl-9 pr-3 text-xs"
            />
          </div>

          {/* Primary New Booking Action */}
          <Button
            variant="brand"
            onClick={onNewBookingClick}
            className="font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New booking</span>
          </Button>
        </>
      }
    />
  );
}
